const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { PDFDocument, rgb } = require("pdf-lib");
const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");
require("dotenv").config();
const { DateTime } = require('luxon'); // Import Luxon for date manipulation

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
      return { name: articleShortName, href: href };
    });
    console.log(articles);
    res.render("articles", { articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to fetch headlines based on articleHref
app.get("/:articleHref", async (req, res) => {
  try {
    const articleHref = req.params.articleHref;
    console.log(articleHref);

    const stats = await axios.get(
      `https://api.airtable.com/v0/appaAzKgj3wMGo5p1/tblzJ9VED0fA3izbG?filterByFormula=SEARCH('${articleHref}~', {Headlines})&sort%5B0%5D%5Bfield%5D=%D0%9F%D0%BE%D1%80%D1%8F%D0%B4%D0%BE%D0%BA+%D0%B2+%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%B0%D1%86%D0%B8%D0%B8&sort%5B0%5D%5Bdirection%5D=asc`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const content = await axios.get(
      `https://api.airtable.com/v0/appaAzKgj3wMGo5p1/tblXUxWPficSiWpyy?filterByFormula=SEARCH('${articleHref}~', {headline_in_main_article})&sort%5B0%5D%5Bfield%5D=headline_in_main_article&sort%5B0%5D%5Bdirection%5D=asc`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    )

    // const data = await response.json();
    res.render("headlines", { data: stats.data, content: content.data });
  } catch (error) {
    console.error("Error fetching headlines:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
