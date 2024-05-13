const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.azafshu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    // collection
    const blogCollection = client.db("blogDB").collection("blog");

    // sending (single data) to the database through the server from client side
    app.post("/blog", async (req, res) => {
      const newBlog = req.body;
      console.log(newBlog);
      const result = await blogCollection.insertOne(newBlog);
      res.send(result);
    });

    // get (all data) from database through server and send to client side
    app.get("/blog", async (req, res) => {
      const cursor = blogCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //getting (single data) from database through server and send to client side
    app.get("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });

    // delete a data from database
    app.delete("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogCollection.deleteOne(query);
      res.send(result);
    });
    // update data
    app.put("/blog/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedBlog = req.body;
      const blog = { $set: { ...updatedBlog } };
      const result = await blogCollection.updateOne(filter, blog, options);
      res.send(result);
    });

    // email
    app.get("/craft/email/:email", async (req, res) => {
      console.log(req.params.email);
      const result = await blogCollection
        .find({
          email: req.params.email,
        })
        .toArray();
      res.send(result);
    });

    // search functionality
    app.get("/blog-search", async (req, res) => {
      let filter = {};
      if (req.query.search) {
        filter.name = { $regex: req.query.search, $options: "i" };
      }
      const result = await blogCollection.find(filter).toArray();
      res.send(result);
    });

    // featured blog
    app.get("/featuredblog", async (req, res) => {
      const blog = {
        name: 1,
        posterName: 1,
        posterPhoto: 1,
        wordCount: { $size: { $split: ["$longdescription", " "] } },
      };
      const newBlog = await blogCollection
        .aggregate([
          { $project: blog },
          { $sort: { wordCount: -1 } },
          { $limit: 10 },
        ])
        .toArray();

      const result = newBlog.map((newBlog, index) => ({
        ...newBlog,
        serial: index + 1,
      }));
      res.send(result);
    });

    // checking connection with mongodb server
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Plant server is running");
});

app.listen(port, () => {
  console.log(`Plant server is running on port ${port}`);
});
