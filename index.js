import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import "dotenv/config";
import bcrypt from "bcrypt";

const app = express();
const port = 3000;

// --- DUMMY LOCAL DATABASE (In-Memory) ---
let users = [];       
let quizResults = []; 

const subjectsList = [
    { id: 0, subject: "Python", topic: "Basics" },
    { id: 1, subject: "Python", topic: "OOPS" },
    { id: 2, subject: "Python", topic: "Encapsulation" },
    { id: 3, subject: "DSA", topic: "Linked Lists" },
    { id: 4, subject: "DSA", topic: "Sorting and Searching" },
    { id: 5, subject: "DSA", topic: "Stacks and Queues" },
    { id: 6, subject: "DBMS", topic: "SQL Queries" },
    { id: 7, subject: "DBMS", topic: "Normalization & Indexing" },
    { id: 8, subject: "DBMS", topic: "NoSQL vs SQL" },
    { id: 9, subject: "Maths", topic: "Limits and Continuity" },
    { id: 10, subject: "Maths", topic: "Derivatives" },
    { id: 11, subject: "Maths", topic: "Integrals" }
];

const dummyQuestions = {
    "Python": {
        "Basics": [
            { q: "What is the output of print(2**3)?", op1: "6", op2: "8", op3: "9", op4: "12", correct: "8" },
            { q: "Which keyword is used for functions?", op1: "func", op2: "define", op3: "def", op4: "function", correct: "def" }
        ],
        "OOPS": [
            { q: "What is 'self' in Python classes?", op1: "A keyword", op2: "Current instance", op3: "Constructor", op4: "Private method", correct: "Current instance" }
        ]
    },
    "DSA": {
        "Stacks and Queues": [
            { q: "Which data structure is LIFO?", op1: "Queue", op2: "Stack", op3: "Array", op4: "Linked List", correct: "Stack" },
            { q: "What operation inserts an element into a stack?", op1: "Pop", op2: "Push", op3: "Enqueue", op4: "Peek", correct: "Push" }
        ]
    },
    "DBMS": {
        "SQL Queries": [
            { q: "Which command removes all records from a table?", op1: "DELETE", op2: "DROP", op3: "TRUNCATE", op4: "REMOVE", correct: "TRUNCATE" }
        ]
    }
};

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

app.use(session({
    secret: "VIT_PROJECT_SECRET",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 }
}));

// --- ROUTES ---

app.get("/", (req, res) => res.render("login", { message: null }));
app.get("/signup", (req, res) => res.render("signup", { message: null }));

app.get("/home", (req, res) => {
    const isLoggedIn = req.session.user_id || req.cookies.user;
    if (isLoggedIn) {
        res.render("home", { loggedIn: true });
    } else {
        res.redirect("/");
    }
});

app.get("/subjects", (req, res) => {
    if (!req.session.user_id) return res.redirect("/");
    res.render("subjects");
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.clearCookie("user");
    res.redirect("/");
});

app.post("/authsignup", async (req, res) => {
    const { email, password, username, cpassword } = req.body;
    if (password !== cpassword) return res.render("signup", { message: "Passwords do not match" });

    // Explicit check in local memory
    const userExists = users.find(u => u.email === email || u.username === username);
    if (userExists) return res.render("signup", { message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ id: users.length + 1, username, email, password: hashedPassword });
    res.render("login", { message: "Signup successful! Please login." });
});

app.post("/authlogin", async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user_id = user.id;
        req.session.username = user.username;
        res.cookie("user", user.id, { maxAge: 1000 * 60 * 60 });
        res.redirect("/home");
    } else {
        res.render("login", { message: "Invalid email or password" });
    }
});

app.get("/questions/:id", (req, res) => {
    if (!req.session.user_id) return res.redirect("/");
    const quizInfo = subjectsList[req.params.id];
    if (!quizInfo) return res.redirect("/subjects");

    const questions = dummyQuestions[quizInfo.subject]?.[quizInfo.topic] || [];
    res.render("question", {
        ques: questions.map(q => ({ 
            question: q.q, 
            options: [q.op1, q.op2, q.op3, q.op4], 
            correctAnswer: q.correct 
        })),
        topic: quizInfo.topic,
        subject: quizInfo.subject
    });
});

app.post("/submit", (req, res) => {
    const { subject, topic, answer, question } = req.body;
    let score = 0;
    let reviewKey = [];

    const userAnswers = Object.keys(req.body)
        .filter(key => key.startsWith("q"))
        .map(key => req.body[key]);

    const correctAnswers = Array.isArray(answer) ? answer : [answer];
    const questionTexts = Array.isArray(question) ? question : [question];

    correctAnswers.forEach((correct, index) => {
        if (correct === userAnswers[index]) {
            score++;
        } else {
            reviewKey.push({ q: questionTexts[index], a: correct, w: userAnswers[index] || "Unanswered" });
        }
    });

    quizResults.push({ username: req.session.username || "Guest", subject, topic, marks: score });
    res.render("results", { score, key: reviewKey });
});

app.get("/leaderboard", (req, res) => {
    const subject = req.query.subject;
    const filteredResults = subject 
        ? quizResults.filter(r => r.subject === subject)
        : quizResults;

    res.render("leader", {
        details: filteredResults.sort((a, b) => b.marks - a.marks),
        subject: subject || "Overall",
        subjects: ["Python", "DSA", "DBMS", "Maths"]
    });
});

app.listen(port, () => console.log(`🚀 Server active at http://localhost:${port}`));