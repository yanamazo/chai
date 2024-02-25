const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { PDFDocument, rgb } = require("pdf-lib");
const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");
require("dotenv").config();
const { DateTime } = require('luxon'); // Import Luxon for date manipulation

const showdown  = require('showdown');
const converter = new showdown.Converter();


// converter = new showdown.Converter(),
// text      = '# hello, markdown!',
// html      = converter.makeHtml(text);
// console.log(html);

const token = process.env.TOKEN;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Set EJS as the view engine
app.set("view engine", "ejs");

// Set the path for views directory
app.set("views", path.join(__dirname, "views"));

// Airtable API configuration
const AIRTABLE_API_KEY = token;
const BASE_ID = "appaAzKgj3wMGo5p1";

// Endpoint to fetch articles
app.get("/", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.airtable.com/v0/${BASE_ID}/tblJl8bnH44dsSTHH?sort%5B0%5D%5Bfield%5D=%D0%9D%D0%BE%D0%BC%D0%B5%D1%80&sort%5B0%5D%5Bdirection%5D=asc`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    const articles = response.data.records.map((record) => {
      const articleShortName = record.fields.article_short_name;
      const href = articleShortName.split("/")[0]; // Extract symbols before "/"
      const rec = record.id;
      return { name: articleShortName, href: href, record: rec };
    });
    console.log(JSON.stringify(articles));
    res.render("articles", { articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to fetch headlines based on articleHref
// app.get("/:articleHref", async (req, res) => {
//   try {
//     const articleHref = req.params.articleHref;
//     console.log(articleHref);

//     const stats = await axios.get(
//       `https://api.airtable.com/v0/appaAzKgj3wMGo5p1/tblzJ9VED0fA3izbG?filterByFormula=SEARCH('${articleHref}~', {Headlines})&sort%5B0%5D%5Bfield%5D=%D0%9F%D0%BE%D1%80%D1%8F%D0%B4%D0%BE%D0%BA+%D0%B2+%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%B0%D1%86%D0%B8%D0%B8&sort%5B0%5D%5Bdirection%5D=asc`,
//       {
//         headers: {
//           Authorization: `Bearer ${AIRTABLE_API_KEY}`,
//         },
//       }
//     );

//     const content = await axios.get(
//       `https://api.airtable.com/v0/appaAzKgj3wMGo5p1/tblXUxWPficSiWpyy?filterByFormula=SEARCH('${articleHref}~', {headlines})&sort%5B0%5D%5Bfield%5D=%D0%9D%D0%BE%D0%BC%D0%B5%D1%80+%D1%84%D1%80%D0%B0%D0%B3%D0%BC%D0%B5%D0%BD%D1%82%D0%B0&sort%5B0%5D%5Bdirection%5D=asc`,
//       {
//         headers: {
//           Authorization: `Bearer ${AIRTABLE_API_KEY}`,
//         },
//       }
//     )

//     console.log(converter.makeHtml(content.data.records[0].fields.verified))

//     // const data = await response.json();
//     res.render("new_headlines", { records:  });
//   } catch (error) {
//     console.error("Error fetching headlines:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

app.get("/:articleHref", async (req, res) => {
  try {
    const articleHref = req.params.articleHref;
    console.log(articleHref);

    // Fetch data from Airtable API
    const response = await axios.get(
      `https://api.airtable.com/v0/appaAzKgj3wMGo5p1/tblXUxWPficSiWpyy?filterByFormula=SEARCH('${articleHref}~', {headlines})&sort%5B0%5D%5Bfield%5D=headline_in_main_article&sort%5B0%5D%5Bdirection%5D=asc`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    let stats = {
      verified: 0,
      not_verified: 0,
      rewrite: 0
    };

    // Manipulate data after it's fetched
    const records = response.data.records.map(record => {
      if (record.fields) {
        // Convert 'not_verified' field from Markdown to HTML if it exists
        if (record.fields.not_verified) {
          record.fields.not_verified = converter.makeHtml(record.fields.not_verified);
          stats.not_verified++;
        }
        // Convert 'verified' field from Markdown to HTML if it exists
        if (record.fields.verified) {
          record.fields.verified = converter.makeHtml(record.fields.verified);
          stats.verified++;
        }
        // Convert 'rewrite' field from Markdown to HTML if it exists
        if (record.fields.rewrite) {
          record.fields.rewrite = converter.makeHtml(record.fields.rewrite);
          stats.rewrite++;
        }
      }
      return record;
    });


    let segmentGroups = {};

// Iterate over the records to group them by segment_name
records.forEach(record => {
    const segmentName = record.fields.headlines;
    if (!segmentGroups[segmentName]) {
        segmentGroups[segmentName] = [];
    }
    segmentGroups[segmentName].push(record);
});
console.log(segmentGroups);

    // Send the modified data to the frontend along with stats
    res.render("new_headlines", { segmentGroups });
  } catch (error) {
    console.error("Error fetching data:", error);
    // Handle errors appropriately
    res.status(500).send("Error fetching data");
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
