/**
 * Hardcoded example submissions for few-shot prompting.
 *
 * These examples are included in the gap analysis prompt to show the LLM
 * what a complete, well-described submission looks like. They are based on
 * realistic UCSD use cases.
 *
 * TODO: Replace these placeholder examples with real curated examples
 * from the AI Idea Form CSV data once available.
 */

export const exampleSubmissions: string[] = [
  // Example 1: AI Agent for Transaction Approvers (P2, chat output)
  `{
  "projectIdea": {
    "title": "AI Agent to Support Transaction Approvers",
    "description": "Campus users have a painpoint around managing approvals across disparate systems (Oracle, Concur, Kuali, ServiceNow, Ecotime, UCPath). An AI agent where users can ask 'show my pending approvals' and get live results from source systems via APIs.",
    "domain": "Business & Financial Services",
    "timeline": "6-12 months",
    "existingStatus": "No — new project",
    "projectGoal": "Consolidate approval workflows into a single AI-powered interface",
    "currentProcess": "Users must log into each system separately to check pending approvals. No unified view exists.",
    "projectComplexity": "High — multiple system integrations",
    "preferredTool": "TritonGPT"
  },
  "gather": {
    "protectionLevel": "P2",
    "protectionLevelLabel": "Internal",
    "selectedDataSources": [
      { "level": "P2", "label": "UCSD internal systems" }
    ],
    "details": {
      "dataType": ["Transactional records", "Approval queues"],
      "sourceSystem": "Oracle, Concur, Kuali, ServiceNow, Ecotime, UCPath",
      "dataSize": "10,000+ approval records across systems",
      "regulatoryContext": ["none"],
      "additionalNotes": ""
    }
  },
  "refine": {
    "refinements": [
      { "id": "r1", "taskType": "extract", "description": "Pull pending approval data from each system's API", "dataPrep": "filter" },
      { "id": "r2", "taskType": "summarize", "description": "Present a consolidated view of all pending approvals", "dataPrep": "combine" }
    ],
    "audience": "my-team",
    "additionalContext": ""
  },
  "present": {
    "outputs": [
      {
        "format": "chat",
        "formatLabel": "AI Chat Assistant",
        "description": "Conversational interface where users ask about their approvals",
        "feasibility": "allowed"
      }
    ]
  }
}`,

  // Example 2: AI chatbot for Nano3 facility website (P1, knowledge_base output)
  `{
  "projectIdea": {
    "title": "AI-Powered Chatbot for Nano3 Cleanroom Facility",
    "description": "The Nano3 cleanroom facility at UCSD receives hundreds of repetitive questions about equipment availability, training requirements, and scheduling. We want an AI chatbot embedded on our website that can answer FAQs, guide new users through the onboarding process, and direct complex questions to staff.",
    "domain": "Research & Facilities",
    "timeline": "3-6 months",
    "existingStatus": "No — new project",
    "projectGoal": "Reduce staff time spent answering repetitive questions by 60% and improve user onboarding experience",
    "currentProcess": "Users email facility staff or browse a static FAQ page. Staff manually respond to each inquiry, often with the same answers.",
    "projectComplexity": "Medium — single data source, standard chatbot",
    "preferredTool": "TritonGPT"
  },
  "gather": {
    "protectionLevel": "P1",
    "protectionLevelLabel": "Public",
    "selectedDataSources": [
      { "level": "P1", "label": "Public website content" }
    ],
    "details": {
      "dataType": ["FAQ documents", "Training manuals", "Equipment specs"],
      "sourceSystem": "Nano3 website, internal SharePoint",
      "dataSize": "~200 documents, 500 pages total",
      "regulatoryContext": ["none"],
      "additionalNotes": "All content is already publicly available on the Nano3 website."
    }
  },
  "refine": {
    "refinements": [
      { "id": "r1", "taskType": "classify", "description": "Categorize incoming questions by topic (equipment, scheduling, training, safety)", "dataPrep": "clean" },
      { "id": "r2", "taskType": "generate", "description": "Generate natural language responses from the knowledge base", "dataPrep": "combine" }
    ],
    "audience": "external-users",
    "additionalContext": "The chatbot should be friendly and accessible to users with varying technical backgrounds."
  },
  "present": {
    "outputs": [
      {
        "format": "knowledge_base",
        "formatLabel": "Knowledge Base / FAQ Bot",
        "description": "AI-powered knowledge base embedded on the Nano3 facility website",
        "feasibility": "allowed"
      }
    ]
  }
}`,

  // Example 3: AI mentor matching solution (P2, interactive_app output)
  `{
  "projectIdea": {
    "title": "AI-Driven Mentor Matching for Graduate Students",
    "description": "Graduate students often struggle to find faculty mentors whose research interests align with theirs. We want an AI solution that analyzes student research interests, faculty publications, and lab openings to suggest optimal mentor-mentee matches across departments.",
    "domain": "Academic Affairs & Student Services",
    "timeline": "6-12 months",
    "existingStatus": "No — new project",
    "projectGoal": "Improve mentor-mentee matching quality and reduce time-to-match from weeks to minutes",
    "currentProcess": "Students browse department websites, attend info sessions, and cold-email faculty. Success depends heavily on personal networks and luck.",
    "projectComplexity": "Medium — NLP matching algorithm, multiple data sources",
    "preferredTool": "Custom solution"
  },
  "gather": {
    "protectionLevel": "P2",
    "protectionLevelLabel": "Internal",
    "selectedDataSources": [
      { "level": "P2", "label": "UCSD internal systems" },
      { "level": "P1", "label": "Public faculty profiles" }
    ],
    "details": {
      "dataType": ["Student profiles", "Faculty publications", "Research interests", "Lab availability"],
      "sourceSystem": "Graduate Division database, faculty profile system, UCSD Research Portal",
      "dataSize": "~5,000 student profiles, ~2,000 faculty profiles, ~50,000 publications",
      "regulatoryContext": ["FERPA"],
      "additionalNotes": "Student data includes educational records subject to FERPA. Faculty publication data is public."
    }
  },
  "refine": {
    "refinements": [
      { "id": "r1", "taskType": "classify", "description": "Classify research interests into a taxonomy of topics and subtopics", "dataPrep": "clean" },
      { "id": "r2", "taskType": "extract", "description": "Extract key themes from faculty publications and student statements of interest", "dataPrep": "combine" },
      { "id": "r3", "taskType": "recommend", "description": "Generate ranked mentor-mentee match suggestions with compatibility scores", "dataPrep": "combine" }
    ],
    "audience": "students-and-faculty",
    "additionalContext": "Matching should consider research area overlap, availability, and department diversity goals."
  },
  "present": {
    "outputs": [
      {
        "format": "interactive_app",
        "formatLabel": "Interactive Web Application",
        "description": "Web app where students input their interests and receive ranked mentor suggestions with explanations",
        "feasibility": "allowed_with_conditions",
        "conditions": "Student PII must be de-identified in the matching algorithm; only display names and public profiles in results."
      }
    ]
  }
}`,
];
