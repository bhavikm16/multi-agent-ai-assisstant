from fastapi import FastAPI
from pydantic import BaseModel
from crewai import Crew, Agent, Task
from crewai_tools import SerperDevTool
from langchain_google_genai import ChatGoogleGenerativeAI
from memory import load_memory, update_topic
import os

# -------------------------
# ENV VARIABLES
# -------------------------
os.environ["GOOGLE_API_KEY"] = "AIzaSyChuHfWv8MJ0SgJTNjhT66sVCtjVKdo77A"
os.environ["SERPER_API_KEY"] = "f925c2ee210192230ef1b8565ab25e6d5b2f3ff7"

app = FastAPI()

# -------------------------
# MODELS (TOKEN OPTIMIZED)
# -------------------------
research_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_output_tokens=250,
)

explain_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.2,
    max_output_tokens=350,
)

fact_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_output_tokens=250,
)

search_tool = SerperDevTool()

# -------------------------
# REQUEST SCHEMA
# -------------------------
class AskRequest(BaseModel):
    topic: str

# -------------------------
# API ENDPOINT
# -------------------------
@app.post("/ask")
def ask_ai(req: AskRequest):
    memory = load_memory()
    update_topic(req.topic)

    researcher = Agent(
        llm=research_llm,
        role="Research Assistant",
        goal="Find accurate information",
        backstory="Find facts with sources.",
        tools=[search_tool],
        verbose=False,
    )

    explainer = Agent(
        llm=explain_llm,
        role="Explanation Assistant",
        goal="Explain clearly",
        backstory="Explain simply.",
        verbose=False,
    )

    fact_checker = Agent(
        llm=fact_llm,
        role="Fact Checker",
        goal="Verify accuracy",
        backstory="Check claims against sources.",
        tools=[search_tool],
        verbose=False,
    )

    task1 = Task(
        description=(
            f"Research '{req.topic}'. "
            "Return 3–5 bullets, <25 words each, 1 source URL."
        ),
        agent=researcher,
    )

    task2 = Task(
        description="Explain the research above in under 200 words.",
        agent=explainer,
    )

    task3 = Task(
        description=(
            "Reproduce explanation, fact-check claims, "
            "and give confidence score (0–100)."
        ),
        agent=fact_checker,
    )

    crew = Crew(
        agents=[researcher, explainer, fact_checker],
        tasks=[task1, task2, task3],
        respect_context_window=True,
        verbose=False,
    )

    result = crew.kickoff()

    return {
        "topic": req.topic,
        "answer": result,
        "recent_topics": memory["recent_topics"]
    }
