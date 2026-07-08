// One-time migration: import existing local .md notes into Firestore.
// Also creates the shared Firebase account on first run.
// Run with:  node scripts/migrate.mjs
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { initializeApp } from "firebase/app";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import { firebaseConfig, syncAccount } from "../firebase-config.js";

const NOTES_DIR = "C:/Users/Connekt.me/Documents/Market Notes";

function parseMd(raw, id) {
  raw = raw.replace(/\r\n/g, "\n");
  const m = {
    name: id, symbol: "", quote: "", category: "", target: "",
    price: "", changeDay: "", changeWeek: "", changeMonth: "", body: "",
  };
  if (raw.startsWith("---\n")) {
    const rest = raw.slice(4);
    const end = rest.indexOf("\n---");
    if (end !== -1) {
      const front = rest.slice(0, end);
      let body = rest.slice(end + 4);
      m.body = body.startsWith("\n") ? body.slice(1) : body;
      for (const line of front.split("\n")) {
        const i = line.indexOf(":");
        if (i === -1) continue;
        const k = line.slice(0, i).trim();
        const v = line.slice(i + 1).trim();
        if (k === "name") m.name = v;
        else if (k === "symbol") m.symbol = v;
        else if (k === "quote") m.quote = v;
        else if (k === "category") m.category = v;
        else if (k === "target") m.target = v;
        else if (k === "price") m.price = v;
        else if (k === "changeDay" || k === "change") m.changeDay = v;
        else if (k === "changeWeek") m.changeWeek = v;
        else if (k === "changeMonth") m.changeMonth = v;
      }
    } else m.body = raw;
  } else m.body = raw;
  return m;
}

async function signInShared(auth) {
  const { email, password } = syncAccount;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("signed in to shared account");
  } catch (e) {
    if (e?.code === "auth/user-not-found" || e?.code === "auth/invalid-credential") {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("created shared account");
    } else throw e;
  }
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInShared(auth);

  const files = readdirSync(NOTES_DIR).filter((f) => f.endsWith(".md"));
  for (const f of files) {
    const id = f.replace(/\.md$/, "");
    const data = parseMd(readFileSync(join(NOTES_DIR, f), "utf8"), id);
    await setDoc(doc(db, "markets", id), { ...data, updatedAt: serverTimestamp() });
    console.log("migrated:", id, "-", data.name);
  }

  const snap = await getDocs(collection(db, "markets"));
  console.log(`\nFirestore now has ${snap.size} markets.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("\nMIGRATION FAILED:", e?.code || "", e?.message || e);
  process.exit(1);
});
