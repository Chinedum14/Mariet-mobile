// Firestore data layer — the shared "markets" collection both apps read/write.
import {
  collection, doc, getDoc, getDocs, onSnapshot, setDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./firebase";
import { syncAccount } from "../firebase-config";

const COL = "markets";

// Signs into the shared Firebase account so every device sees the same data.
// The account is created automatically the first time any device signs in.
export async function signInShared() {
  const { email, password } = syncAccount;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    const code = e?.code || "";
    if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (e2) {
        if (e2?.code === "auth/email-already-in-use") {
          await signInWithEmailAndPassword(auth, email, password); // wrong password
        } else {
          throw e2;
        }
      }
    } else {
      throw e;
    }
  }
}

// One-shot read of all markets (used by the background alert task).
export async function getMarketsOnce() {
  const snap = await getDocs(query(collection(db, COL), orderBy("name")));
  const out = [];
  snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
  return out;
}

// Live subscription to all markets. cb(marketsArray). Returns unsubscribe fn.
export function subscribeMarkets(cb) {
  const q = query(collection(db, COL), orderBy("name"));
  return onSnapshot(q, (snap) => {
    const out = [];
    snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
    cb(out);
  });
}

function slugify(name) {
  let s = String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "market";
}

async function uniqueId(base) {
  let id = base, n = 2;
  // Rare collisions only; a few reads at most.
  while ((await getDoc(doc(db, COL, id))).exists()) {
    id = `${base}-${n++}`;
  }
  return id;
}

const FIELDS = ["name", "symbol", "quote", "category", "target",
  "price", "changeDay", "changeWeek", "changeMonth", "change3d", "body"];

function clean(m) {
  const out = {};
  for (const k of FIELDS) out[k] = m[k] != null ? m[k] : "";
  return out;
}

export async function createMarket({ name, symbol = "", quote = "", category = "", target = "" }) {
  const id = await uniqueId(slugify(name));
  const data = { ...clean({ name, symbol, quote, category, target }), updatedAt: serverTimestamp() };
  await setDoc(doc(db, COL, id), data);
  return { id, ...data };
}

export async function saveMarket(m) {
  await setDoc(
    doc(db, COL, m.id),
    { ...clean(m), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function deleteMarket(id) {
  await deleteDoc(doc(db, COL, id));
}
