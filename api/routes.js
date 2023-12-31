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
    const convertDateToMMDDYYYY = (dateString) => {
      const [date, time] = dateString.split(" ");
      const [day, month, year] = date.split("/");

      return new Date(`${month}/${day}/${year} ${time}`).getTime();
    };

    const barcodeId = req.query.barcodeId;
    const { expiryStartTime, expiryEndTime } = req.query;

    if (expiryStartTime >= expiryEndTime) {
      return res.json([]);
    }

    const filteredResponse = data
      .slice(1)
      .map(([barcode, created_at, expired_at]) => ({
        barcode,
        created_at,
        expired_at,
      }))
      .filter((res) => {
        if (!!barcodeId) {
          return res.barcode === barcodeId;
        }
        return true;
      })
      .filter((res) => {
        const offSet = -420;

        const epochExpirationDate = convertDateToMMDDYYYY(res.expired_at);

        const expirationDate =
          process.env.NODE_ENV === "development"
            ? epochExpirationDate
            : Math.floor((epochExpirationDate + offSet * 60000) / 1000) * 1000;

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

module.exports = router;
