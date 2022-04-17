import OrbitDB from "orbit-db";
import { create } from "ipfs";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { default as KeyResolver } from "key-did-resolver";

const initOrbitDB = async () => {
  const ipfsOptions = { repo: "./ipfs" };
  const ipfs = await create(ipfsOptions);

  // create identity (with a DID)
  // https://github.com/orbitdb/orbit-db-identity-provider
  const Identities = require("orbit-db-identity-provider");
  Identities.DIDIdentityProvider.setDIDResolver(KeyResolver.getResolver());

  const seed = new Uint8Array(32);
  const didProvider = new Ed25519Provider(seed);
  const identity = await Identities.createIdentity({
    type: "DID",
    didProvider,
  });

  // create db instance
  const orbitdb = await OrbitDB.createInstance(ipfs, { identity });

  // init a keyvalue db
  const db = await orbitdb.keyvalue("keyvalue", {
    // Give write access to ourselves
    accessController: {
      // here we need to assign identity.id, not identity.publicKey
      write: [identity.id],
    },
  });

  console.log("db address", db.address.toString());
  console.log("db identity publickey", db.identity.publicKey);

  // load locally the persisted before using the database.
  // loading the database locally before using it is highly recommended
  await db.load();
  console.log("db loaded");

  return db;
};

async function main() {
  const db = await initOrbitDB();

  await db.put("key1", "hello1");
  await db.put("key2", "hello2");
  await db.put("key3", "hello3");

  console.log("key3 is", db.get("key3"));
}

main();
