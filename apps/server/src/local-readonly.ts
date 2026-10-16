import { connect } from "mongoose";

import { app } from "./app";

const endpoint = process.env.MONGO_ENDPOINT;
if (!endpoint) throw new Error("MONGO_ENDPOINT is required");

connect(endpoint, { serverSelectionTimeoutMS: 30000 })
  .then(() => {
    app.listen(8080, "127.0.0.1", () => console.log("Local API listening on 127.0.0.1:8080"));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
