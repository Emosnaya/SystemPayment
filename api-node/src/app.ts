import cors from "cors";
import express from "express";
import * as healthController from "./controllers/healthController";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import routes from "./routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", healthController.healthCheck);

app.use(routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
