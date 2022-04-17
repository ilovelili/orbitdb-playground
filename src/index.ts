import OrbitDB from "orbit-db";
import { create } from "ipfs";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { default as KeyResolver } from "key-did-resolver";

// orbit-db doc: https://github.com/orbitdb/orbit-db/blob/main/API.md
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

  const ipfsId = (await ipfs.id()).id;

  // create db instance
  // can be both IPFS instance or IPFS daemon
  // https://github.com/orbitdb/orbit-db#module-with-ipfs-instance
  const orbitdb = await OrbitDB.createInstance(ipfs, {
    identity,
    // @ts-ignore offline mode with an id
    offline: true,
    id: ipfsId,
  });

  // init a keyvalue db
  const db = await orbitdb.kvstore("kvstore", {
    // Give write access to ourselves
    accessController: {
      // here we need to assign identity.id, not identity.publicKey
      write: [identity.id],
    },
  });

  console.log("db address", db.address.toString());
  console.log("db identity publickey", db.identity.publicKey);

  // orbit-db-store events https://github.com/orbitdb/orbit-db-store
  db.events.on("load", (address) => {
    console.log("db loaded");
    console.log(address);
  });

  db.events.on("ready", (address) => {
    console.log("db ready");
    console.log(address);
  });

  // load locally the persisted before using the database.
  // loading the database locally before using it is highly recommended
  await db.load();
  return db;
};

async function main() {
  const db = await initOrbitDB();

  console.log(await db.put("key1", "hello1"));
  console.log(await db.put("key2", "hello2"));
  console.log(await db.put("key3", "hello3"));

  console.log("key3 is", db.get("key3"));
}

main();
