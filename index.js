import express from "express";

const app = express();

app.get("/", () => {
  console.log("listando...");
});

app.listen(3000);
