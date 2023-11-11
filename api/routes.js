const sheet = require("../src/googleSheetsService");
const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
var cors = require("cors");

const sheetId = "1YOJ-f64EiszK96mvF1l9ci748CvHnJJES27ddKPFSyg";
const tabName = `barcodes(${new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}).format(new Date())})`;

const range = "A:C";

router.use(bodyParser.json());
router.use(cors({ origin: true, credentials: true }));

router.get("/", (_, res) => {
  res.json({
    message: "API Healthcheck - ok",
  });
});

router.get("/barcodes", async (req, res) => {
  const googleSheetClient = await sheet._getGoogleSheetClient();
  const data = await sheet._readGoogleSheet(
    googleSheetClient,
    sheetId,
    tabName,
    range
  );
  if (!data) {
    res.json({
      status: "Error",
    });
  } else {
    const parseDate = (dateString) =>
      dateString ? new Date(parseInt(dateString)) : undefined;

    const expiryStartTime = parseDate(req.query.expiryStartTime);
    const expiryEndTime = parseDate(req.query.expiryEndTime);

    const filteredResponse = data
      .slice(1)
      .map(([barcode, created_at, expired_at]) => ({
        barcode,
        created_at,
        expired_at,
      }))
      .filter((res) => {
        const expirationDate = new Date(res.expired_at);

        if (expiryStartTime && !expiryEndTime) {
          return expirationDate >= expiryStartTime;
        }

        if (expiryEndTime && !expiryStartTime) {
          return expirationDate <= expiryEndTime;
        }

        if (expiryStartTime && expiryEndTime) {
          return (
            expirationDate >= expiryStartTime && expirationDate <= expiryEndTime
          );
        }

        return true;
      });

    res.json(filteredResponse);
  }
});

router.get("/barcodes/:id", async (req, res) => {
  const googleSheetClient = await sheet._getGoogleSheetClient();
  const existingData = await sheet._readGoogleSheet(
    googleSheetClient,
    sheetId,
    tabName,
    range
  );
  const barcodeReq = req.params.id;
  const foundBarcode = existingData.find((row) => row[0] === barcodeReq);

  if (!foundBarcode) {
    return res.status(400).send({
      code: 200,
      barcode: undefined,
      message: "Barcode not found",
    });
  } else {
    return res.json({
      code: 200,
      barcode: foundBarcode[0],
      created_at: foundBarcode[1],
      isExpired: new Date() >= new Date(foundBarcode[2]),
    });
  }
});

module.exports = router;
