import express from "express";
import cors from "cors";
import { config } from "./config";
import routes from "./routes";

const app = express();
app.use(express.json());
app.use(cors({ origin: config.corsOrigin }));

app.use("/", routes);

app.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
});
