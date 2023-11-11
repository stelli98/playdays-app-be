const express = require("express");
const app = express();
const port = 3000;

const routes = require("../api/routes");

app.use("/api/v1", routes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
