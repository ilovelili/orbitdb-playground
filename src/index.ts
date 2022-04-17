import OrbitDB from "orbit-db";
import { create } from "ipfs";

const main = async () => {
  const ipfsOptions = { repo: "./ipfs" };
  const ipfs = await create(ipfsOptions);

  const orbitdb = await OrbitDB.createInstance(ipfs);
  const db = await orbitdb.keyvalue("first-database");
  console.log(db.address.toString());
};

main();
