package com.srhcodeverse.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.srhcodeverse.backend.entity.CertificateDefinition;
import com.srhcodeverse.backend.entity.CertificateQuestion;
import com.srhcodeverse.backend.entity.InterviewQuestion;
import com.srhcodeverse.backend.repository.CertificateDefinitionRepository;
import com.srhcodeverse.backend.repository.CertificateQuestionRepository;
import com.srhcodeverse.backend.repository.InterviewQuestionRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Idempotent seed data for the interview question bank and certificate
 * assessments. Content is only inserted when a category/definition is empty.
 */
@Component
@ConditionalOnProperty(name = "codeverse.features.seed-on-startup", havingValue = "true", matchIfMissing = true)
public class AssessmentContentSeeder implements ApplicationRunner {

    private final InterviewQuestionRepository questionRepository;
    private final CertificateDefinitionRepository definitionRepository;
    private final CertificateQuestionRepository certificateQuestionRepository;
    private final ObjectMapper objectMapper;

    public AssessmentContentSeeder(InterviewQuestionRepository questionRepository,
                                   CertificateDefinitionRepository definitionRepository,
                                   CertificateQuestionRepository certificateQuestionRepository,
                                   ObjectMapper objectMapper) {
        this.questionRepository = questionRepository;
        this.definitionRepository = definitionRepository;
        this.certificateQuestionRepository = certificateQuestionRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedInterviews();
        seedCertificates();
    }

    private void seedInterviews() {
        if (questionRepository.countByActiveTrue() > 0) return;

        // JAVA
        mcq("JAVA", "OOP", "EASY", "Which OOP principle hides internal state behind methods?",
                new String[]{"Inheritance", "Encapsulation", "Polymorphism", "Abstraction"}, 1,
                "Encapsulation keeps fields private and exposes behaviour through methods, protecting invariants.");
        mcq("JAVA", "Collections", "EASY", "Which collection does not allow duplicate elements?",
                new String[]{"ArrayList", "LinkedList", "HashSet", "ArrayDeque"}, 2,
                "Set implementations such as HashSet reject duplicates using equals/hashCode.");
        mcq("JAVA", "Strings", "EASY", "What is the result of \"java\".substring(1, 3)?",
                new String[]{"ja", "av", "va", "ava"}, 2,
                "substring(begin, end) includes begin and excludes end, so indexes 1 and 2 are returned.");
        mcq("JAVA", "Exceptions", "MEDIUM", "Which block always executes whether or not an exception is thrown?",
                new String[]{"try", "catch", "finally", "throws"}, 2,
                "finally runs after try/catch, which is why it is used for cleanup.");
        mcq("JAVA", "Concurrency", "MEDIUM", "Which type provides atomic increment operations without explicit locks?",
                new String[]{"int", "Integer", "AtomicInteger", "BigDecimal"}, 2,
                "AtomicInteger uses compare-and-swap to update safely across threads.");
        mcq("JAVA", "Java 8+", "MEDIUM", "Which functional interface represents a function that takes one argument and returns a value?",
                new String[]{"Supplier", "Consumer", "Function", "Predicate"}, 2,
                "Function<T,R> maps an input T to an output R.");
        mcq("JAVA", "JVM", "MEDIUM", "Which memory area stores objects created with new?",
                new String[]{"Stack", "Heap", "Metaspace", "Program counter"}, 1,
                "Objects are allocated on the heap; references may live on the stack.");
        shortQ("JAVA", "Collections", "MEDIUM", "Explain the difference between ArrayList and LinkedList and when you would choose each.",
                "ArrayList is backed by a resizable array: O(1) indexed access and good iteration, but inserts/removals in the middle shift elements. LinkedList is a doubly linked list: O(1) insertion/removal at known nodes, but O(n) indexed access and higher memory overhead. Prefer ArrayList by default; use LinkedList only for frequent head operations or when using it as a Deque.",
                "array,index,insert,memory,deque", "Both implement List; the trade-off is random access versus insertion cost.");

        // DSA
        mcq("DSA", "Complexity", "EASY", "What is the time complexity of binary search on a sorted array?",
                new String[]{"O(1)", "O(log n)", "O(n)", "O(n log n)"}, 1,
                "Each comparison halves the search space, giving logarithmic time.");
        mcq("DSA", "Arrays", "EASY", "Which technique finds a pair summing to a target in one pass?",
                new String[]{"Nested loops", "Hash map of complements", "Sorting only", "Binary search only"}, 1,
                "Store each value and look for target - value, giving average O(n).");
        mcq("DSA", "Strings", "MEDIUM", "A variable-size sliding window is best suited to which problem?",
                new String[]{"Reverse a linked list", "Longest substring without repeating characters", "Binary search", "Tree height"}, 1,
                "The window expands and shrinks while maintaining a valid substring.");
        mcq("DSA", "Linked List", "MEDIUM", "How many pointers are typically used to reverse a singly linked list iteratively?",
                new String[]{"One", "Two", "Three", "Four"}, 2,
                "prev, current and next are needed to reverse links without losing the rest of the list.");
        mcq("DSA", "Trees", "MEDIUM", "Which traversal of a binary search tree visits values in sorted order?",
                new String[]{"Preorder", "Inorder", "Postorder", "Level order"}, 1,
                "Inorder visits left subtree, node, right subtree, which is ascending for a BST.");
        mcq("DSA", "Graphs", "MEDIUM", "Which algorithm finds shortest paths in an unweighted graph?",
                new String[]{"DFS", "BFS", "Dijkstra", "Topological sort"}, 1,
                "BFS explores by edge count, so the first visit is the shortest path.");
        mcq("DSA", "DP", "HARD", "Which property must a problem have for dynamic programming to apply?",
                new String[]{"Random input", "Overlapping subproblems and optimal substructure", "Sorted input", "No recursion"}, 1,
                "DP caches overlapping subproblems and builds an optimal solution from optimal sub-solutions.");
        shortQ("DSA", "Arrays", "MEDIUM", "Explain the two-pointer technique and give one problem where it applies.",
                "Two pointers maintain two indexes that move according to a rule, often from opposite ends or at different speeds. In a sorted array, moving the pointer at the smaller value reduces the pair-sum range. It also applies to removing duplicates in place, palindrome checks and partitioning. It reduces many O(n^2) scans to O(n).",
                "pointer,index,sorted,linear,duplicate", "The key is that pointer movement never skips a valid answer.");

        // SQL
        mcq("SQL", "Joins", "EASY", "Which join keeps unmatched rows from the left table?",
                new String[]{"INNER JOIN", "LEFT JOIN", "CROSS JOIN", "SELF JOIN"}, 1,
                "LEFT JOIN preserves every left row and fills missing right columns with NULL.");
        mcq("SQL", "Aggregation", "EASY", "Which clause filters groups after aggregation?",
                new String[]{"WHERE", "HAVING", "ORDER BY", "LIMIT"}, 1,
                "WHERE filters rows before grouping; HAVING filters groups.");
        mcq("SQL", "Nulls", "EASY", "Which condition correctly finds rows where email is missing?",
                new String[]{"email = NULL", "email IS NULL", "email == NULL", "email <> NULL"}, 1,
                "NULL is unknown, so comparisons must use IS NULL or IS NOT NULL.");
        mcq("SQL", "Subqueries", "MEDIUM", "What does a CTE begin with?",
                new String[]{"WITH", "SELECT", "FROM", "CREATE"}, 0,
                "A common table expression starts with WITH and names an intermediate result.");
        mcq("SQL", "Window Functions", "MEDIUM", "Which function assigns unique sequential numbers with no ties?",
                new String[]{"RANK", "DENSE_RANK", "ROW_NUMBER", "NTILE"}, 2,
                "ROW_NUMBER always produces a unique sequence even when values tie.");
        mcq("SQL", "Indexes", "MEDIUM", "What is the main cost of adding an index?",
                new String[]{"Slower reads", "Extra storage and slower writes", "More rows", "Fewer constraints"}, 1,
                "Indexes must be maintained on insert/update/delete and consume space.");
        mcq("SQL", "Transactions", "MEDIUM", "Which statement permanently applies a transaction?",
                new String[]{"ROLLBACK", "COMMIT", "SAVEPOINT", "BEGIN"}, 1,
                "COMMIT makes all statements in the transaction durable.");
        shortQ("SQL", "Joins", "MEDIUM", "Explain the difference between INNER JOIN and LEFT JOIN with an example.",
                "INNER JOIN returns only rows that match in both tables. LEFT JOIN returns every row from the left table plus matching right rows, using NULL when there is no match. For example, customers LEFT JOIN orders lists customers with zero orders too, while INNER JOIN would omit them.",
                "inner,left,match,null,all rows", "The preserved side and NULL padding are the key distinctions.");

        // SPRING
        mcq("SPRING", "Dependency Injection", "EASY", "Which injection style is recommended for required dependencies?",
                new String[]{"Field injection", "Constructor injection", "Setter injection", "Static injection"}, 1,
                "Constructor injection makes dependencies explicit, supports immutability and simplifies testing.");
        mcq("SPRING", "Spring Boot", "EASY", "What does @SpringBootApplication combine?",
                new String[]{"Only @Component", "Configuration, auto-configuration and component scanning", "Only @RestController", "Only @EnableScheduling"}, 1,
                "It is a convenience annotation combining @Configuration, @EnableAutoConfiguration and @ComponentScan.");
        mcq("SPRING", "REST", "MEDIUM", "Which status code should a successful POST that creates a resource return?",
                new String[]{"200", "201", "204", "302"}, 1,
                "201 Created indicates a new resource was created; include a Location header when possible.");
        mcq("SPRING", "Validation", "MEDIUM", "Which annotation activates bean validation on a request body?",
                new String[]{"@Valid", "@Entity", "@Transactional", "@Repository"}, 0,
                "@Valid triggers validation of the annotated DTO.");
        mcq("SPRING", "JPA", "MEDIUM", "Which fetch type is generally preferred for associations?",
                new String[]{"EAGER", "LAZY", "NONE", "CASCADE"}, 1,
                "LAZY avoids loading data that the request does not need and prevents accidental N+1 explosions.");
        mcq("SPRING", "Security", "MEDIUM", "Where must ownership of a resource be checked?",
                new String[]{"Only in React", "On the backend using the authenticated principal", "In CSS", "In the database trigger only"}, 1,
                "The server derives identity from authentication and verifies ownership for every access.");
        mcq("SPRING", "Transactions", "MEDIUM", "What happens when a @Transactional method throws a runtime exception?",
                new String[]{"Nothing", "The transaction rolls back", "It commits", "It retries forever"}, 1,
                "Runtime exceptions roll back by default; checked exceptions require configuration.");
        shortQ("SPRING", "Testing", "MEDIUM", "How would you test that a student cannot read another student's interview session?",
                "Authenticate as student A, create or seed a session owned by student B, then call the session endpoint as A and assert a not-found or forbidden response. Also assert the repository query is scoped by the authenticated user. The test must verify both the HTTP status and that no data leaks.",
                "authenticate,owner,forbidden,not found,scoped", "Ownership tests must prove the server rejects cross-user access.");

        // REACT
        mcq("REACT", "Hooks", "EASY", "Which hook stores component state?",
                new String[]{"useEffect", "useState", "useMemo", "useRef"}, 1,
                "useState returns the current state value and a setter that schedules a re-render.");
        mcq("REACT", "Effects", "EASY", "What does an empty dependency array in useEffect mean?",
                new String[]{"Run on every render", "Run once after mount", "Never run", "Run before render"}, 1,
                "An empty array runs the effect after the initial render; cleanup runs on unmount.");
        mcq("REACT", "Lists", "MEDIUM", "Why are stable keys required when rendering lists?",
                new String[]{"For CSS", "To help React match elements between renders", "For sorting", "For accessibility only"}, 1,
                "Keys let React identify which items changed, were added or removed.");
        mcq("REACT", "State", "MEDIUM", "How should an array in state be updated?",
                new String[]{"Push into it", "Splice it", "Create a new array", "Mutate it directly"}, 2,
                "State must be replaced immutably so React detects the change.");
        mcq("REACT", "Routing", "MEDIUM", "Which hook reads dynamic route parameters?",
                new String[]{"useState", "useParams", "useEffect", "useRef"}, 1,
                "useParams returns the key/value pairs from the matched route.");
        mcq("REACT", "API", "MEDIUM", "Where should an auth token be attached to API requests?",
                new String[]{"In every component", "In a shared request interceptor", "In CSS", "In the router"}, 1,
                "A shared client interceptor keeps authentication consistent and avoids duplication.");
        mcq("REACT", "Testing", "MEDIUM", "Which query is preferred in React Testing Library?",
                new String[]{"getByTestId", "getByRole", "querySelector", "getByClass"}, 1,
                "Role-based queries reflect how assistive technology and users find elements.");
        shortQ("REACT", "Performance", "MEDIUM", "Explain how you would reduce unnecessary re-renders in a React page.",
                "Identify state that changes frequently and keep it local to the smallest component. Memoise expensive derived values with useMemo, stabilise callbacks with useCallback where they are dependencies, and split large components. Avoid creating new objects in props on every render, and measure before optimising.",
                "state,local,memo,usememo,callback,measure", "Measure first; memoisation has its own cost.");

        // FULLSTACK
        mcq("FULLSTACK", "API Design", "MEDIUM", "Which HTTP method is idempotent and used to replace a resource?",
                new String[]{"POST", "PUT", "PATCH", "CONNECT"}, 1,
                "PUT replaces a resource and repeated identical calls have the same effect.");
        mcq("FULLSTACK", "Security", "MEDIUM", "Where should authorization decisions be made?",
                new String[]{"Only in the browser", "On the server", "In CSS", "In the database comments"}, 1,
                "Client checks improve UX but the server must enforce every rule.");
        mcq("FULLSTACK", "Database", "MEDIUM", "Which relationship does a foreign key primarily enforce?",
                new String[]{"Ordering", "Referential integrity", "Encryption", "Caching"}, 1,
                "A foreign key ensures referenced rows exist and prevents orphaned data.");
        mcq("FULLSTACK", "Integration", "MEDIUM", "Which status code means the user is authenticated but not allowed?",
                new String[]{"400", "401", "403", "404"}, 2,
                "401 is unauthenticated; 403 is authenticated but forbidden.");
        mcq("FULLSTACK", "Debugging", "MEDIUM", "A React page shows stale data after a mutation. What is the most direct fix?",
                new String[]{"Reload the whole page", "Invalidate or refetch the affected query after the mutation", "Add more CSS", "Disable the API"}, 1,
                "Refetching or invalidating the affected data keeps the cache consistent with the server.");
        mcq("FULLSTACK", "Architecture", "HARD", "Why should a REST API return DTOs instead of JPA entities?",
                new String[]{"DTOs are faster to type", "They control the contract and avoid lazy-loading or data leaks", "Entities cannot be serialised", "DTOs are required by HTTP"}, 1,
                "DTOs decouple the API from persistence and prevent accidental exposure of internal fields.");
        shortQ("FULLSTACK", "Project", "MEDIUM", "Describe how you would debug a failing login flow across React and Spring Boot.",
                "Check the browser network tab for the request URL, status and payload. Verify the backend receives the request and inspect server logs. Confirm the password hash comparison and token generation. Then check that the frontend stores and attaches the token and that protected endpoints accept it. Reproduce with curl to isolate frontend from backend.",
                "network,status,payload,logs,token,curl", "Isolate the failing layer before changing code.");
        shortQ("FULLSTACK", "Architecture", "HARD", "How would you design progress tracking so it survives logout and works across devices?",
                "Store progress in the database keyed by the authenticated user and the content identifier, never in localStorage. The backend derives the user from the token, validates ownership and recalculates percentages from completed records. The frontend reads progress from the API on load and refreshes after mutations. Unique constraints prevent duplicate progress rows.",
                "database,authenticated,ownership,recalculate,unique,api", "Server-side persistence is the source of truth.");

        // HR
        hr("HR", "Introduction", "EASY", "Tell me about yourself and why you are pursuing a software development role.",
                "Give a concise story: current background, the skills you have built, one concrete project, and why this role fits your goals. Keep it under two minutes and connect each claim to evidence.",
                "background,skills,project,goals,evidence");
        hr("HR", "Strengths", "EASY", "What is your greatest strength, and how has it helped a team?",
                "Name one strength, then prove it with a specific situation, the action you took and the measurable result. Avoid generic claims without evidence.",
                "strength,situation,action,result,team");
        hr("HR", "Weakness", "MEDIUM", "What is a weakness you are actively working on?",
                "Choose a real but non-critical weakness, explain its impact, and describe the concrete habit or feedback loop you use to improve. Show progress rather than denying the weakness.",
                "weakness,impact,improve,habit,feedback");
        hr("HR", "Teamwork", "MEDIUM", "Describe a conflict with a teammate and how you resolved it.",
                "Use a structured story: context, the disagreement, how you listened and separated facts from assumptions, the agreed resolution, and what you learned. Focus on behaviour and outcomes, not blame.",
                "conflict,listen,resolve,agreement,learned");
        hr("HR", "Project", "MEDIUM", "Walk me through the most complex project you have built.",
                "Explain the problem, your role, the architecture and key trade-offs, the hardest bug or decision, and the outcome. Be ready to go one level deeper on any technology you mention.",
                "problem,role,architecture,tradeoff,bug,outcome");
        hr("HR", "Pressure", "MEDIUM", "Tell me about a time you missed a deadline.",
                "Own the miss, explain the early warning signs, what you changed in planning or communication, and how you prevented recurrence. Avoid blaming others.",
                "deadline,ownership,communication,change,prevent");
        hr("HR", "Learning", "EASY", "How do you learn a new technology quickly?",
                "Describe a repeatable method: read official docs, build a tiny working example, compare with what you know, then apply it to a real task. Mention how you verify understanding.",
                "docs,example,practice,verify,apply");
        hr("HR", "Career", "MEDIUM", "Where do you see yourself in three years?",
                "Connect short-term learning to a realistic trajectory: deepen backend or full-stack expertise, own larger features, mentor others and contribute to design. Keep it honest and aligned with the role.",
                "learn,own,mentor,design,grow");
    }

    private void seedCertificates() {
        certificate("java-foundations", "Java Foundations", "Java", "JF", "from-orange-500 to-red-500", 1,
                "Prove your command of Java syntax, OOP, collections and exception handling.",
                "Java, OOP, collections, exceptions",
                "java-foundations", 80, 10, null, "JAVA", 60, 70, 8, 20, 5,
                new Object[][]{
                        {"Which keyword prevents a class from being extended?", new String[]{"static", "final", "private", "sealed"}, 1, "final classes cannot be subclassed."},
                        {"Which collection keeps insertion order and allows duplicates?", new String[]{"HashSet", "ArrayList", "TreeMap", "PriorityQueue"}, 1, "ArrayList preserves index order and permits duplicates."},
                        {"What is the superclass of all Java classes?", new String[]{"Object", "Class", "Base", "System"}, 0, "java.lang.Object is the root of the class hierarchy."},
                        {"Which exception is unchecked?", new String[]{"IOException", "SQLException", "NullPointerException", "ClassNotFoundException"}, 2, "NullPointerException extends RuntimeException."},
                        {"What does the == operator compare for object references?", new String[]{"Content", "Identity", "Hash code", "Size"}, 1, "== compares references; equals compares logical content when overridden."},
                        {"Which interface must a class implement to be used in a for-each loop?", new String[]{"Runnable", "Iterable", "Comparable", "Serializable"}, 1, "for-each uses Iterable and its iterator."},
                        {"What is the result of 7 / 2 in Java when both operands are int?", new String[]{"3.5", "3", "4", "Error"}, 1, "Integer division truncates toward zero."},
                        {"Which access modifier allows access within the same package only?", new String[]{"private", "protected", "default (no modifier)", "public"}, 2, "Package-private is the default when no modifier is written."}
                });

        certificate("dsa-problem-solving", "DSA and Problem Solving", "DSA", "DS", "from-violet-500 to-blue-500", 2,
                "Demonstrate algorithmic thinking across arrays, hashing, trees and dynamic programming.",
                "Complexity, arrays, hashing, trees, graphs, DP",
                "dsa-essentials", 80, 25, "array,string,dsa", "DSA", 60, 70, 8, 25, 5,
                new Object[][]{
                        {"What is the average time complexity of a hash map lookup?", new String[]{"O(1)", "O(log n)", "O(n)", "O(n^2)"}, 0, "Hashing gives average constant-time lookup."},
                        {"Which structure does BFS use?", new String[]{"Stack", "Queue", "Heap", "Set"}, 1, "BFS processes nodes in FIFO order."},
                        {"Which sorting algorithm is stable and O(n log n) in the worst case?", new String[]{"Quick sort", "Merge sort", "Selection sort", "Heap sort"}, 1, "Merge sort is stable with guaranteed O(n log n)."},
                        {"What does a dynamic programming solution store?", new String[]{"Random values", "Results of overlapping subproblems", "Only the input", "Pointers"}, 1, "Memoisation or tabulation reuses subproblem results."},
                        {"In a BST, which traversal yields sorted order?", new String[]{"Preorder", "Inorder", "Postorder", "Level order"}, 1, "Inorder visits nodes in ascending key order."},
                        {"Which technique finds the longest substring without repeats efficiently?", new String[]{"Nested loops", "Sliding window", "Binary search", "DFS"}, 1, "A sliding window tracks the current valid range."},
                        {"What is the space complexity of merge sort?", new String[]{"O(1)", "O(log n)", "O(n)", "O(n^2)"}, 2, "Merging requires a temporary array proportional to input size."},
                        {"Which graph algorithm finds shortest paths with non-negative weights?", new String[]{"DFS", "BFS only", "Dijkstra", "Kruskal"}, 2, "Dijkstra greedily settles the nearest unvisited node."}
                });

        certificate("sql-databases", "SQL and Databases", "Database", "DB", "from-amber-500 to-yellow-400", 3,
                "Show that you can query, join, aggregate and reason about relational data.",
                "SQL, joins, aggregation, indexes, transactions",
                "sql-mastery", 80, 8, null, "SQL", 60, 70, 8, 20, 5,
                new Object[][]{
                        {"Which clause filters groups?", new String[]{"WHERE", "HAVING", "ORDER BY", "LIMIT"}, 1, "HAVING is evaluated after GROUP BY."},
                        {"Which join preserves unmatched left rows?", new String[]{"INNER", "LEFT", "CROSS", "SELF"}, 1, "LEFT JOIN fills missing right columns with NULL."},
                        {"How do you test for a missing value?", new String[]{"= NULL", "IS NULL", "== NULL", "<> NULL"}, 1, "NULL comparisons require IS NULL."},
                        {"Which function assigns unique row numbers?", new String[]{"RANK", "DENSE_RANK", "ROW_NUMBER", "NTILE"}, 2, "ROW_NUMBER has no ties."},
                        {"What does COMMIT do?", new String[]{"Discards changes", "Persists the transaction", "Creates an index", "Deletes rows"}, 1, "COMMIT makes the transaction durable."},
                        {"What is the main benefit of an index?", new String[]{"Faster writes", "Faster reads for matching queries", "Less storage", "More rows"}, 1, "Indexes speed lookups and sorts at the cost of write overhead."},
                        {"Which keyword starts a common table expression?", new String[]{"WITH", "SELECT", "FROM", "CREATE"}, 0, "WITH names one or more CTEs."},
                        {"Which normal form removes partial dependencies?", new String[]{"1NF", "2NF", "3NF", "BCNF"}, 1, "2NF removes partial dependencies on a composite key."}
                });

        certificate("spring-boot-backend", "Spring Boot Backend", "Backend", "SB", "from-emerald-500 to-cyan-400", 4,
                "Validate your ability to build secure, tested Spring Boot REST services.",
                "Spring Boot, REST, JPA, security, testing",
                "spring-boot-backend", 80, 10, null, "SPRING", 60, 70, 8, 25, 5,
                new Object[][]{
                        {"Which injection style is preferred for required dependencies?", new String[]{"Field", "Constructor", "Setter", "Static"}, 1, "Constructor injection makes dependencies explicit."},
                        {"Which status code means created?", new String[]{"200", "201", "204", "400"}, 1, "201 Created is returned after successful resource creation."},
                        {"Which annotation activates DTO validation?", new String[]{"@Valid", "@Entity", "@Transactional", "@Bean"}, 0, "@Valid triggers bean validation."},
                        {"Which fetch type is safer by default for associations?", new String[]{"EAGER", "LAZY", "NONE", "CASCADE"}, 1, "LAZY avoids loading unnecessary data."},
                        {"Where should ownership be enforced?", new String[]{"Client only", "Server using the authenticated principal", "CSS", "Logs"}, 1, "The backend must verify ownership on every access."},
                        {"What does @Transactional do on a runtime exception?", new String[]{"Commits", "Rolls back", "Retries", "Ignores"}, 1, "Runtime exceptions roll back by default."},
                        {"Which tool tests MVC endpoints?", new String[]{"MockMvc", "Selenium", "JUnit only", "Postman"}, 0, "MockMvc performs request/response tests without a server."},
                        {"Why cap page size?", new String[]{"Better styling", "Avoid unbounded queries", "Required by HTTP", "Faster typing"}, 1, "A hard cap protects the database and response size."}
                });

        certificate("fullstack-development", "Full Stack Development", "Full Stack", "FL", "from-blue-500 to-cyan-400", 5,
                "Combine React, REST, Java and databases into a complete working application.",
                "React, REST, Java, SQL, security, deployment",
                "react-frontend,spring-boot-backend", 75, 20, null, "FULLSTACK", 60, 75, 10, 30, 5,
                new Object[][]{
                        {"Which HTTP method replaces a resource idempotently?", new String[]{"POST", "PUT", "PATCH", "CONNECT"}, 1, "PUT replaces the resource and is idempotent."},
                        {"Where must authorization be enforced?", new String[]{"Browser only", "Server", "CSS", "README"}, 1, "Client checks are UX; the server enforces access."},
                        {"Which status code means authenticated but forbidden?", new String[]{"400", "401", "403", "404"}, 2, "403 is authenticated but not allowed."},
                        {"Why return DTOs instead of entities?", new String[]{"Faster typing", "Control the API contract and avoid leaks", "Entities cannot serialise", "HTTP requires it"}, 1, "DTOs decouple persistence from the API."},
                        {"Which hook reads route parameters?", new String[]{"useState", "useParams", "useEffect", "useRef"}, 1, "useParams returns dynamic route values."},
                        {"How should state arrays be updated in React?", new String[]{"Push", "Splice", "Create a new array", "Mutate directly"}, 2, "Immutable updates let React detect changes."},
                        {"What prevents duplicate progress rows?", new String[]{"A CSS rule", "A database unique constraint", "A React key", "A log message"}, 1, "Unique constraints enforce integrity under concurrency."},
                        {"What is the safest way to store progress?", new String[]{"localStorage", "In the database keyed by the authenticated user", "In a cookie", "In the URL"}, 1, "Server-side persistence survives devices and cannot be forged."},
                        {"Which is a safe deployment practice?", new String[]{"Commit secrets", "Use environment variables for configuration", "Disable tests", "Drop tables on deploy"}, 1, "Secrets belong in environment configuration, not source control."},
                        {"Why validate on both client and server?", new String[]{"Client validation is enough", "Server validation is authoritative; client validation improves UX", "Only server validation matters", "Neither matters"}, 1, "The client can be bypassed, so the server must validate."}
                });

        certificate("frontend-development", "Frontend Development", "Frontend", "FE", "from-cyan-500 to-blue-500", 6,
                "Prove that you can build responsive, accessible React interfaces backed by real APIs.",
                "HTML, CSS, JavaScript, React, accessibility",
                "react-frontend", 75, 0, null, null, 0, 70, 8, 20, 5,
                new Object[][]{
                        {"Which React hook stores local component state?", new String[]{"useEffect", "useState", "useMemo", "useRef"}, 1, "useState returns the current value and a setter."},
                        {"What does the key prop help React do?", new String[]{"Style elements", "Identify list items across renders", "Fetch data", "Create routes"}, 1, "Stable keys let React reconcile lists correctly."},
                        {"Which CSS layout is best for one-dimensional rows or columns?", new String[]{"Grid", "Flexbox", "Float", "Table"}, 1, "Flexbox handles one axis; Grid handles two."},
                        {"Why should state be updated immutably?", new String[]{"It is faster to type", "React detects changes by reference", "It avoids CSS", "It removes the need for keys"}, 1, "New references let React schedule a re-render."},
                        {"Which attribute describes an image for screen readers?", new String[]{"title", "alt", "src", "aria-hidden"}, 1, "alt text is announced when the image cannot be seen."},
                        {"When does useEffect run?", new String[]{"During render", "After the commit phase", "Before rendering", "Only on the server"}, 1, "Effects run after React commits changes to the DOM."},
                        {"Which status code should an API return for invalid input?", new String[]{"200", "201", "400", "500"}, 2, "400 Bad Request signals invalid client input."},
                        {"Why avoid storing secrets in frontend code?", new String[]{"It is slower", "Anyone can read shipped JavaScript", "It breaks CSS", "It disables React"}, 1, "Frontend bundles are public; secrets must stay on the server."}
                });

        certificate("interview-readiness", "Interview Readiness", "Career", "IR", "from-fuchsia-500 to-violet-500", 7,
                "Show that you can explain your work, handle technical rounds and communicate clearly under time pressure.",
                "Interview strategy, DSA revision, Java, SQL, system design, behavioural",
                "spring-boot-backend", 50, 10, null, "FULLSTACK", 65, 65, 8, 20, 5,
                new Object[][]{
                        {"What does the STAR method structure?", new String[]{"A database schema", "A behavioural answer", "A CSS layout", "A REST endpoint"}, 1, "STAR organises Situation, Task, Action and Result."},
                        {"What is the average lookup complexity of a hash map?", new String[]{"O(1)", "O(n)", "O(log n)", "O(n^2)"}, 0, "Hashing gives average constant-time lookup."},
                        {"Which join keeps unmatched rows from the left table?", new String[]{"INNER JOIN", "LEFT JOIN", "CROSS JOIN", "SELF JOIN"}, 1, "LEFT JOIN preserves all left rows."},
                        {"Where must ownership checks run?", new String[]{"Only in React", "On the backend", "In CSS", "In the README"}, 1, "The server is the security boundary."},
                        {"What is the best first step in a system design answer?", new String[]{"Pick a vendor", "Clarify requirements and scale", "Write code", "Add microservices"}, 1, "Requirements drive every later decision."},
                        {"How should you handle a question you cannot answer?", new String[]{"Invent an answer", "Explain your reasoning and what you would look up", "Stay silent", "Change the topic"}, 1, "Honest reasoning is stronger than a fabricated answer."},
                        {"Which status code means authenticated but forbidden?", new String[]{"400", "401", "403", "404"}, 2, "403 means the identity is known but lacks permission."},
                        {"What makes a project explanation credible?", new String[]{"Listing every file", "Ownership, trade-offs and a measurable result", "Claiming all team work", "Avoiding questions"}, 1, "Specific ownership and results are convincing."}
                });
    }

    private void mcq(String category, String topic, String difficulty, String prompt,
                     String[] options, int correct, String explanation) {
        questionRepository.save(InterviewQuestion.builder()
                .category(category).topic(topic).difficulty(difficulty).type("MCQ")
                .prompt(prompt).optionsJson(json(options)).correctOption(correct)
                .referenceAnswer(options[correct]).explanation(explanation)
                .points(1).active(true).build());
    }

    private void shortQ(String category, String topic, String difficulty, String prompt,
                        String reference, String rubric, String explanation) {
        questionRepository.save(InterviewQuestion.builder()
                .category(category).topic(topic).difficulty(difficulty).type("SHORT")
                .prompt(prompt).referenceAnswer(reference).rubric(rubric)
                .explanation(explanation).points(2).active(true).build());
    }

    private void hr(String category, String topic, String difficulty, String prompt,
                    String reference, String rubric) {
        questionRepository.save(InterviewQuestion.builder()
                .category(category).topic(topic).difficulty(difficulty).type("HR")
                .prompt(prompt).referenceAnswer(reference).rubric(rubric)
                .explanation("Behavioural answers are reviewed against the STAR structure; they are not auto-scored.")
                .points(0).active(true).build());
    }

    private void certificate(String slug, String title, String category, String icon, String accent,
                             int sortOrder, String description, String skills, String courseSlugs,
                             int lessonPercent, int solvedProblems, String problemTopics,
                             String interviewCategory, int interviewScore, int passScore,
                             int questionCount, int durationMinutes, int attemptLimit,
                             Object[][] questions) {
        if (definitionRepository.findBySlug(slug).isPresent()) return;
        CertificateDefinition definition = definitionRepository.save(CertificateDefinition.builder()
                .slug(slug).title(title).description(description).category(category)
                .icon(icon).accent(accent).skills(skills)
                .requiredCourseSlugs(courseSlugs).requiredLessonPercent(lessonPercent)
                .requiredSolvedProblems(solvedProblems).requiredProblemTopics(problemTopics)
                .requiredInterviewCategory(interviewCategory).requiredInterviewScore(interviewScore)
                .assessmentPassScore(passScore).assessmentQuestionCount(questionCount)
                .assessmentDurationMinutes(durationMinutes).attemptLimit(attemptLimit)
                .sortOrder(sortOrder).active(true).build());
        for (Object[] row : questions) {
            certificateQuestionRepository.save(CertificateQuestion.builder()
                    .definition(definition)
                    .prompt((String) row[0])
                    .optionsJson(json((String[]) row[1]))
                    .correctOption((Integer) row[2])
                    .explanation((String) row[3])
                    .active(true).build());
        }
    }

    private String json(String[] values) {
        try {
            return objectMapper.writeValueAsString(List.of(values));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to serialise seed options", ex);
        }
    }
}
