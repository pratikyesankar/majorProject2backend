const express = require("express")
const app = express()
const cors = require("cors")
const { initializeDatabase } = require("./db/db.connect")
const Lead = require("./models/lead.model")
const SalesAgent = require("./models/salesAgent.model")
const Comment = require("./models/comment.model")

// ------------------------------------------------------------------------------------------------------

const corsOptions = {
  origin: "https://major-project2frontend.vercel.app/",
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())

initializeDatabase()

// ------------------------- Lead Routes -------------------------
// Create a new lead
async function createLead(data) {
  try {
    const { name, source, salesAgent, status, timeToClose, priority, tags } =
      data
    if (
      !name ||
      !source ||
      !salesAgent ||
      !status ||
      !timeToClose ||
      !priority ||
      !tags
    ) {
      throw new Error("All fields are required")
    }
    const agentExists = await SalesAgent.findById(salesAgent)
    if (!agentExists) {
      throw new Error("Sales agent not found")
    }
    const lead = new Lead({
      name,
      source,
      salesAgent,
      status,
      timeToClose,
      priority,
      tags,
    })
    await lead.save()
    return await Lead.findById(lead._id).populate("salesAgent")
  } catch (error) {
    console.log("Error creating lead:", error)
    throw error
  }
}

app.post("/leads", async (req, res) => {
  try {
    const lead = await createLead(req.body)
    res.status(201).json(lead)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// -----------------------------------------------------------------------------------------------------

// Get all leads with optional filters
async function readAllLeads(queryParams) {
  try {
    const { salesAgent, status, source } = queryParams
    const query = {}
    if (salesAgent) query.salesAgent = salesAgent
    if (status) query.status = status
    if (source) query.source = source
    const leads = await Lead.find(query).populate("salesAgent")
    return leads
  } catch (error) {
    console.log("Error fetching leads:", error)
    throw error
  }
}

app.get("/leads", async (req, res) => {
  try {
    const leads = await readAllLeads(req.query)
    if (leads.length > 0) {
      res.status(200).json(leads)
    } else {
      res.status(404).json({ error: "No leads found" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leads" })
  }
})

// ----------------------------------------------------------------------------------------------------

// Get lead by ID
async function readLeadById(leadId) {
  try {
    const lead = await Lead.findById(leadId).populate("salesAgent")
    return lead
  } catch (error) {
    console.log("Error fetching lead:", error)
    throw error
  }
}

app.get("/leads/:id", async (req, res) => {
  try {
    const lead = await readLeadById(req.params.id)
    if (lead) {
      res.status(200).json(lead)
    } else {
      res.status(404).json({ error: "Lead not found" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch lead" })
  }
})

// ------------------------------------------------------------------------------------------------------

// Update lead by ID
async function updateLeadById(leadId, data) {
  try {
    const { name, source, salesAgent, status, timeToClose, priority, tags } =
      data
    if (
      !name ||
      !source ||
      !salesAgent ||
      !status ||
      !timeToClose ||
      !priority ||
      !tags
    ) {
      throw new Error("All fields are required")
    }
    const agentExists = await SalesAgent.findById(salesAgent)
    if (!agentExists) {
      throw new Error("Sales agent not found")
    }
    const lead = await Lead.findByIdAndUpdate(
      leadId,
      { name, source, salesAgent, status, timeToClose, priority, tags },
      { new: true }
    ).populate("salesAgent")
    return lead
  } catch (error) {
    console.log("Error updating lead:", error)
    throw error
  }
}

app.post("/leads/:id", async (req, res) => {
  try {
    const lead = await updateLeadById(req.params.id, req.body)
    if (lead) {
      res.status(200).json(lead)
    } else {
      res.status(404).json({ error: "Lead not found" })
    }
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// --------------------------------------------------------------------------------------------------

// Delete lead by ID
async function deleteLeadById(leadId) {
  try {
    const lead = await Lead.findByIdAndDelete(leadId)
    return lead
  } catch (error) {
    console.log("Error deleting lead:", error)
    throw error
  }
}

app.delete("/leads/:id", async (req, res) => {
  try {
    const lead = await deleteLeadById(req.params.id)
    if (lead) {
      res.status(200).json({ message: "Lead deleted successfully" })
    } else {
      res.status(404).json({ error: "Lead not found" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete lead" })
  }
})

// ------------------------- Sales Agent Routes -------------------------
// Create a new sales agent
async function createSalesAgent(data) {
  try {
    const { name, email } = data
    if (!name || !email) {
      throw new Error("Name and email are required")
    }
    const agentExists = await SalesAgent.findOne({ email })
    if (agentExists) {
      throw new Error("Sales agent with this email already exists")
    }
    const agent = new SalesAgent({ name, email })
    await agent.save()
    return agent
  } catch (error) {
    console.log("Error creating sales agent:", error)
    throw error
  }
}

app.post("/agents", async (req, res) => {
  try {
    const agent = await createSalesAgent(req.body)
    res.status(201).json(agent)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// ------------------------------------------------------------------------------------------------

// Get all sales agents
async function readAllSalesAgents() {
  try {
    const agents = await SalesAgent.find()
    return agents
  } catch (error) {
    console.log("Error fetching sales agents:", error)
    throw error
  }
}

app.get("/agents", async (req, res) => {
  try {
    const agents = await readAllSalesAgents()
    if (agents.length > 0) {
      res.status(200).json(agents)
    } else {
      res.status(404).json({ error: "No sales agents found" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch agents" })
  }
})

// ------------------------- Comment Routes -------------------------
// Create a new comment
async function createComment(leadId, data) {
  try {
    const { commentText, author } = data
    if (!commentText || !author) {
      throw new Error("Comment text and author are required")
    }
    const leadExists = await Lead.findById(leadId)
    if (!leadExists) {
      throw new Error("Lead not found")
    }
    const authorExists = await SalesAgent.findById(author)
    if (!authorExists) {
      throw new Error("Author not found")
    }
    const comment = new Comment({ lead: leadId, commentText, author })
    await comment.save()
    return comment
  } catch (error) {
    console.log("Error creating comment:", error)
    throw error
  }
}

app.post("/leads/:id/comments", async (req, res) => {
  try {
    const comment = await createComment(req.params.id, req.body)
    res.status(201).json(comment)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// -------------------------------------------------------------------------------------------

// Get comments for a lead
async function readCommentsByLeadId(leadId) {
  try {
    const comments = await Comment.find({ lead: leadId }).populate("author")
    return comments
  } catch (error) {
    console.log("Error fetching comments:", error)
    throw error
  }
}

app.get("/leads/:id/comments", async (req, res) => {
  try {
    const comments = await readCommentsByLeadId(req.params.id)
    if (comments.length > 0) {
      res.status(200).json(comments)
    } else {
      res.status(404).json({ error: "No comments found" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" })
  }
})

// ------------------------- Reporting Routes -------------------------
// Get leads closed last week
async function readLeadsClosedLastWeek() {
  try {
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    const leads = await Lead.find({
      status: "Closed",
      closedAt: { $gte: lastWeek },
    }).populate("salesAgent")
    return leads
  } catch (error) {
    console.log("Error fetching last week's closed leads:", error)
    throw error
  }
}

app.get("/report/last-week", async (req, res) => {
  try {
    const leads = await readLeadsClosedLastWeek()
    if (leads.length > 0) {
      res.status(200).json(leads)
    } else {
      res.status(404).json({ error: "No leads found for last week" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch report" })
  }
})

// Get pipeline report
async function readPipelineReport() {
  try {
    const totalLeads = await Lead.countDocuments({ status: { $ne: "Closed" } })
    return { totalLeadsInPipeline: totalLeads }
  } catch (error) {
    console.log("Error fetching pipeline report:", error)
    throw error
  }
}

app.get("/report/pipeline", async (req, res) => {
  try {
    const report = await readPipelineReport()
    res.status(200).json(report)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pipeline report" })
  }
})

// Get closed leads by agent
async function readClosedLeadsByAgent() {
  try {
    const leads = await Lead.aggregate([
      { $match: { status: "Closed" } },
      {
        $group: {
          _id: "$salesAgent",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "salesagents",
          localField: "_id",
          foreignField: "_id",
          as: "salesAgent",
        },
      },
      { $unwind: "$salesAgent" },
      {
        $project: {
          _id: 0,
          salesAgent: "$salesAgent.name",
          count: 1,
        },
      },
    ])
    return leads
  } catch (error) {
    console.log("Error fetching closed-by-agent report:", error)
    throw error
  }
}

app.get("/report/closed-by-agent", async (req, res) => {
  try {
    const leads = await readClosedLeadsByAgent()
    if (leads.length > 0) {
      res.status(200).json(leads)
    } else {
      res.status(404).json({ error: "No closed leads found" })
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch closed-by-agent report" })
  }
})

// ------------------------- Start the Server -------------------------
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
