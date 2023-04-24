import express from "express";
import * as bodyParser from "body-parser";
import path from "path";
import session from "express-session";
import FileStoreFactory from 'session-file-store';
import router from "./separated-by-chatgpt/routes";
import cors from 'cors';

const FileStore = FileStoreFactory(session);
const fileStoreOptions = {};

const app = express();

// Enable CORS for all routes
app.use(cors());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/webhooks', bodyParser.raw({ type: 'application/json' }));
app.use(bodyParser.json());

app.use(session({
  secret: "something crazy",
  store: new FileStore(fileStoreOptions),
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
}));

// app.use(session({
//   secret: "something crazy",
//   store: new FileStore(fileStoreOptions),
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     secure: false, // Set to true for HTTPS
//     httpOnly: true,
//     maxAge: 1000 * 60 * 60 * 24 // 1 day
//   }
// }));


app.use("/", router);

export default app;