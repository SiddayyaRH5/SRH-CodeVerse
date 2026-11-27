package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.entity.*;
import com.srhcodeverse.backend.repository.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Idempotent development content seeder for roadmaps and learning courses.
 * Existing rows are never modified or duplicated. Roadmaps are inserted only
 * when their unique slug is missing; lessons are inserted only when their
 * module/lesson position is missing from an existing course.
 */
@Component
public class FeatureContentSeeder implements ApplicationRunner {

    private final RoadmapRepository roadmapRepository;
    private final RoadmapStageRepository stageRepository;
    private final RoadmapTopicRepository topicRepository;
    private final CourseRepository courseRepository;
    private final CourseLessonRepository lessonRepository;

    public FeatureContentSeeder(RoadmapRepository roadmapRepository,
                                RoadmapStageRepository stageRepository,
                                RoadmapTopicRepository topicRepository,
                                CourseRepository courseRepository,
                                CourseLessonRepository lessonRepository) {
        this.roadmapRepository = roadmapRepository;
        this.stageRepository = stageRepository;
        this.topicRepository = topicRepository;
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedRoadmaps();
        seedCourses();
    }

    // ------------------------------------------------------------------
    // Roadmaps
    // ------------------------------------------------------------------

    private void seedRoadmaps() {
        roadmap("java-full-stack", "Java Full Stack Developer",
                "Frontend, Java backend, databases and deployment in one guided path.",
                "A complete full-stack route for building and shipping Java web applications. "
                        + "Start with web fundamentals and Java, then move through SQL, Spring Boot, React, "
                        + "security, testing and deployment. Each stage lists concrete topics and resources.",
                "Full Stack", "Intermediate", 420,
                "HTML,CSS,JavaScript,React,Java,SQL,Spring Boot,REST,JPA,Testing,Deployment",
                "FS", "from-violet-500 to-cyan-400", 1,
                new Object[][]{
                        {"Web Foundations", "Understand how browsers, HTTP and semantic HTML work before writing application code.", "HTML,CSS,HTTP", 24, "", "Build a responsive static page and explain the request/response cycle.", "HTML structure::Elements, forms, semantic layout and accessibility|CSS layout::Flexbox, grid, responsive units and the box model|HTTP basics::Methods, status codes, headers and the browser dev tools"},
                        {"JavaScript Essentials", "Learn the language behaviour that React and browser APIs depend on.", "JavaScript,DOM,ES6", 30, "1", "Complete the JavaScript exercises and a small DOM interaction.", "Language fundamentals::Variables, functions, scope, arrays and objects|DOM and events::Querying, event handling, forms and validation|Async JavaScript::Promises, async/await and fetch"},
                        {"Java Fundamentals", "Build a solid Java base: types, control flow, methods and arrays.", "Java,Syntax,Arrays", 40, "1", "Solve 10 easy Java problems.", "Types and operators::Primitives, casting, strings and operators|Control flow::Conditions, loops, break and continue|Methods and arrays::Parameters, return values, overloading and arrays"},
                        {"Object Oriented Java", "Model real problems with classes, interfaces and composition.", "OOP,Interfaces,Design", 30, "3", "Design a small domain model with at least three classes.", "Classes and objects::Fields, constructors, encapsulation and toString|Inheritance and polymorphism::Overriding, abstract classes and interfaces|Composition and design::SOLID basics, records and enums"},
                        {"SQL and Databases", "Store and query application data with relational databases.", "SQL,Joins,Schema", 28, "3", "Write queries with joins, grouping and subqueries.", "Query basics::SELECT, WHERE, ORDER BY and LIMIT|Joins and aggregation::INNER/LEFT joins, GROUP BY and HAVING|Schema design::Keys, constraints, normalisation and indexes"},
                        {"Spring Core and Boot", "Wire Java objects with Spring and expose a working Boot application.", "Spring,DI,Spring Boot", 36, "4,5", "Run a Spring Boot app with at least two beans.", "IoC and dependency injection::Beans, scopes, configuration and profiles|Spring Boot basics::Starters, auto-configuration and application properties|Configuration::YAML, environment variables and validation"},
                        {"REST API Development", "Design clean, validated REST endpoints with correct status codes.", "REST,Validation,Errors", 30, "6", "Implement CRUD endpoints with validation and error handling.", "Resource design::URI design, verbs, DTOs and pagination|Validation and errors::Bean validation, exception handlers and problem responses|API testing::curl, Postman and automated controller tests"},
                        {"JPA and Hibernate", "Persist entities safely and avoid common ORM performance traps.", "JPA,Hibernate,SQL", 34, "6,5", "Map a relational model with relationships and queries.", "Entity mapping::Annotations, identifiers and relationships|Repositories::Derived queries, JPQL and pagination|Transactions and performance::Lazy loading, N+1 and fetch strategies"},
                        {"React Frontend", "Build component-driven interfaces that talk to the Spring API.", "React,Hooks,State", 40, "2,7", "Ship a React page that consumes a real REST endpoint.", "Components and props::JSX, composition and lists|Hooks and state::useState, useEffect and custom hooks|Routing and forms::React Router, controlled inputs and validation"},
                        {"Authentication and Security", "Protect APIs with authentication, authorization and safe defaults.", "Security,JWT,CORS", 28, "7", "Secure an endpoint and verify role-based access.", "Authentication::Sessions, JWT and password hashing|Authorization::Roles, ownership checks and method security|Web security::CORS, CSRF, input validation and secrets"},
                        {"Testing and Quality", "Catch regressions with meaningful backend and frontend tests.", "JUnit,Mockito,Vitest", 24, "7,9", "Add unit and integration tests for one feature.", "Backend testing::JUnit, Mockito and Spring Boot test slices|Frontend testing::Component tests and user-event flows|Quality gates::Build, lint and regression suites"},
                        {"Deployment and Projects", "Ship a complete application and present it like a real project.", "Git,Docker,Deployment", 30, "8,9,10,11", "Deploy a full-stack project and write its README.", "Build and packaging::Maven builds, environment configuration and profiles|Containers and hosting::Docker basics and managed hosting|Portfolio project::Documentation, demo script and interview explanation"}
                });

        roadmap("java-backend", "Backend Java Developer",
                "Deep backend engineering with Java, Spring Boot, data and production concerns.",
                "Focused on server-side engineering: Java language depth, collections, concurrency, "
                        + "databases, REST design, Spring Security, testing and operational fundamentals.",
                "Backend", "Intermediate", 320,
                "Java,Collections,Concurrency,SQL,Spring Boot,REST,JPA,Security,Testing",
                "BE", "from-emerald-500 to-cyan-400", 2,
                new Object[][]{
                        {"Java Language Depth", "Move beyond syntax into the parts of Java that interviews and production code test.", "Java,Generics,Streams", 36, "", "Solve medium Java problems using collections and streams.", "Generics and collections::Type parameters, List, Map, Set and iteration|Streams and lambdas::Functional interfaces, map/filter/reduce and collectors|Modern Java::Optional, records, switch expressions and var"},
                        {"Exceptions and Concurrency", "Handle failure and shared state deliberately.", "Exceptions,Threads,Concurrency", 30, "1", "Write a thread-safe counter and explain your choice.", "Exception design::Checked vs unchecked, try-with-resources and custom errors|Threads and executors::Runnable, Callable, pools and futures|Concurrency safety::Locks, atomics, concurrent collections and visibility"},
                        {"SQL for Backend Engineers", "Query and model data the way services actually need it.", "SQL,Indexes,Transactions", 28, "1", "Optimise a slow query using an index and EXPLAIN.", "Relational modelling::Keys, relationships and normal forms|Query patterns::Joins, aggregation, subqueries and CTEs|Transactions and indexes::ACID, isolation and query plans"},
                        {"Spring Core", "Understand the container instead of copying annotations.", "Spring,DI,AOP", 24, "1", "Explain bean lifecycles and build a configurable service.", "Container and beans::Lifecycle, scopes and injection styles|Configuration::Java config, profiles and conditional beans|Cross-cutting concerns::AOP basics, events and scheduling"},
                        {"Spring Boot and REST", "Build production-shaped APIs with Boot.", "Spring Boot,REST,Validation", 34, "4", "Implement a paginated, validated REST resource.", "Boot application structure::Starters, configuration and actuators|REST controllers::DTOs, validation, status codes and pagination|Error handling::Global handlers and consistent error contracts"},
                        {"Persistence with JPA", "Map and query relational data with JPA and Hibernate.", "JPA,Hibernate,Transactions", 32, "3,5", "Implement relationships with correct fetch strategies.", "Mapping::Entities, embeddables and relationships|Repositories and queries::Derived queries, JPQL and projections|Transactions and performance::Lazy loading, N+1, batching and locking"},
                        {"Security and Authentication", "Authenticate users and authorize every sensitive operation.", "Spring Security,JWT,Roles", 28, "5", "Secure an API with JWT and ownership checks.", "Authentication::Password hashing, login and JWT issuance|Authorization::Roles, method security and ownership|Hardening::CORS, rate limits, secrets and validation"},
                        {"Testing Backend Code", "Test behaviour, not implementation details.", "JUnit,Mockito,Integration", 22, "5,6", "Cover a service and a controller with tests.", "Unit tests::JUnit 5, assertions and parameterised tests|Mocks and slices::Mockito and @WebMvcTest|Integration tests::Repository tests and transactional boundaries"},
                        {"Caching and Messaging", "Add performance and asynchronous work without breaking correctness.", "Caching,Queues,Redis", 22, "6", "Describe when a cache or queue is the right tool.", "Caching::Cache-aside, TTLs, invalidation and Redis basics|Messaging::Queues, topics, idempotency and retries|Reliability::Timeouts, backoff and dead-letter handling"},
                        {"Production Readiness", "Operate and explain a backend service.", "Docker,Monitoring,Deployment", 24, "7,8,9", "Containerise the service and add health checks.", "Packaging and containers::Jars, Dockerfiles and configuration|Observability::Logs, metrics, health checks and tracing|Deployment::Environments, migrations and rollback plans"}
                });

        roadmap("frontend-developer", "Frontend Developer",
                "Modern, accessible frontend development with JavaScript and React.",
                "Covers the browser platform, responsive CSS, modern JavaScript, React, routing, "
                        + "state, API integration, accessibility, performance and frontend testing.",
                "Frontend", "Beginner", 220,
                "HTML,CSS,JavaScript,React,Accessibility,Testing",
                "FE", "from-pink-500 to-orange-400", 3,
                new Object[][]{
                        {"HTML and Semantics", "Write structured, accessible markup.", "HTML,Accessibility", 16, "", "Build a semantic multi-section page.", "Document structure::Headings, landmarks, lists and tables|Forms::Labels, inputs, validation and autocomplete|Accessibility basics::Alt text, focus order and ARIA only when needed"},
                        {"CSS and Responsive Design", "Create layouts that work from phone to desktop.", "CSS,Flexbox,Grid", 24, "1", "Build a responsive card grid with no horizontal scroll.", "Box model and typography::Spacing, units, line height and contrast|Flexbox and grid::Alignment, wrapping and responsive patterns|Media queries::Breakpoints, fluid type and mobile-first CSS"},
                        {"JavaScript Fundamentals", "Understand values, functions and scope before frameworks.", "JavaScript,ES6", 28, "1", "Complete 15 small JavaScript exercises.", "Values and functions::Types, coercion, scope and closures|Arrays and objects::Iteration, destructuring and immutability|Modules and tooling::import/export, npm and Vite"},
                        {"DOM and Browser APIs", "Manipulate the page and handle real user input.", "DOM,Events,Fetch", 22, "3", "Build a filterable list with fetch and form validation.", "DOM manipulation::Selection, creation and updates|Events::Bubbling, delegation and forms|Network::fetch, loading states and error handling"},
                        {"React Fundamentals", "Build interfaces from components and data.", "React,JSX,Props", 30, "3", "Build a component tree with reusable cards.", "Components and JSX::Props, children and conditional rendering|Lists and keys::Mapping data and stable keys|Composition::Layout components and reusable UI"},
                        {"Hooks and State", "Manage state and side effects predictably.", "React,Hooks,State", 30, "5", "Implement a form and a data-fetching hook.", "State::useState, derived state and lifting state|Effects::useEffect, cleanup and dependencies|Custom hooks::Extracting reusable behaviour"},
                        {"Routing and API Integration", "Connect the app to real backend endpoints.", "React Router,Axios,Auth", 26, "6", "Ship a page that loads, creates and updates server data.", "Routing::Routes, params, protected routes and navigation|API client::Axios, interceptors and error surfaces|Auth-aware UI::Tokens, loading and unauthorized handling"},
                        {"Accessibility and Performance", "Make the app usable and fast for everyone.", "A11y,Performance", 20, "7", "Audit a page with Lighthouse and fix two issues.", "Accessible components::Keyboard support, labels and focus management|Performance::Code splitting, image sizing and render costs|UX quality::Skeletons, empty states and clear errors"},
                        {"Testing and Deployment", "Protect the UI with tests and ship it.", "Vitest,Testing,Build", 20, "7,8", "Add tests for a page and produce a production build.", "Component tests::Rendering, user events and async states|Regression checks::Lint, build and test scripts|Deployment::Static hosting, environment variables and previews"}
                });

        roadmap("dsa-problem-solving", "DSA and Problem Solving",
                "A structured interview-focused data structures and algorithms path.",
                "Progress from complexity analysis to arrays, hashing, recursion, trees, graphs and "
                        + "dynamic programming. Every stage points at practice problems and revision goals.",
                "DSA", "Intermediate", 260,
                "Complexity,Arrays,Strings,Hashing,Recursion,Trees,Graphs,DP",
                "DS", "from-violet-500 to-blue-500", 4,
                new Object[][]{
                        {"Complexity Analysis", "Reason about time and space before optimising.", "Big O,Complexity", 14, "", "Analyse 10 snippets and state their complexity.", "Big O::Growth rates, constants and worst case|Space complexity::Auxiliary memory and recursion stacks|Trade-offs::Time vs space and practical limits"},
                        {"Arrays and Two Pointers", "Master the most common interview structure.", "Arrays,Two Pointers,Prefix Sum", 30, "1", "Solve 12 array problems including two-pointer variants.", "Array traversal::Indexing, in-place updates and rotation|Two pointers::Opposite ends, fast/slow and partitioning|Prefix sums::Range queries and difference arrays"},
                        {"Strings and Sliding Window", "Handle text and contiguous subarray problems.", "Strings,Sliding Window", 26, "2", "Solve 10 string and window problems.", "String manipulation::Immutability, builders and comparison|Sliding window::Fixed and variable windows|Patterns::Anagrams, palindromes and substring constraints"},
                        {"Hashing", "Trade memory for predictable lookup time.", "HashMap,Set,Frequency", 20, "2", "Solve 10 hashing problems and explain collisions.", "Hash maps::Frequency counts, grouping and lookup|Sets::Duplicates, intersections and membership|Design::Collision handling and when hashing is not enough"},
                        {"Linked Lists, Stacks and Queues", "Work confidently with pointer and LIFO/FIFO structures.", "Linked List,Stack,Queue", 26, "2", "Implement a linked list and solve 8 structure problems.", "Linked lists::Traversal, reversal and cycle detection|Stacks::Matching, monotonic stacks and expression evaluation|Queues and deques::BFS support and sliding maximum"},
                        {"Recursion and Backtracking", "Break problems into smaller identical problems.", "Recursion,Backtracking", 28, "5", "Solve subsets, permutations and one constraint problem.", "Recursion::Base cases, call stacks and tree recursion|Backtracking::Choose, explore, unchoose|Pruning::Avoiding duplicate or invalid branches"},
                        {"Sorting and Binary Search", "Use ordering to reduce work.", "Sorting,Binary Search", 24, "2", "Implement merge sort and solve 8 binary search variants.", "Sorting algorithms::Merge, quick, counting and stability|Binary search::Bounds, rotated arrays and answer-space search|Comparator patterns::Custom ordering and intervals"},
                        {"Trees and BSTs", "Traverse and reason about hierarchical data.", "Trees,BST,Traversal", 30, "6", "Solve 12 tree problems across traversals and BSTs.", "Traversals::Preorder, inorder, postorder and level order|BST properties::Search, insert, validation and ranges|Tree DP::Height, diameter, LCA and path sums"},
                        {"Graphs", "Model relationships and search them efficiently.", "Graphs,BFS,DFS", 30, "7", "Implement BFS/DFS and solve 8 graph problems.", "Representation::Adjacency lists, matrices and edges|Traversal::BFS, DFS, components and cycles|Shortest paths::Dijkstra, topological order and union-find"},
                        {"Dynamic Programming", "Recognise overlapping subproblems and build solutions.", "DP,Memoisation,Tabulation", 34, "6,8", "Solve 12 DP problems from 1D to knapsack.", "Foundations::Memoisation, tabulation and state design|Classic patterns::Fibonacci, knapsack, LIS and LCS|Grid and interval DP::Paths, partitions and edit distance"}
                });

        roadmap("sql-database", "SQL and Database Developer",
                "Query, design and tune relational databases with confidence.",
                "From SELECT and joins to schema design, transactions, indexes and query optimisation. "
                        + "Practice against realistic relational models.",
                "Database", "Beginner", 150,
                "SQL,Joins,Aggregation,Schema,Indexes,Transactions",
                "DB", "from-amber-500 to-yellow-400", 5,
                new Object[][]{
                        {"Relational Foundations", "Understand tables, keys and relational thinking.", "Tables,Keys,Relationships", 14, "", "Model a small e-commerce schema.", "Tables and rows::Columns, data types and nulls|Keys::Primary, foreign, unique and composite keys|Relationships::One-to-one, one-to-many and many-to-many"},
                        {"Querying Data", "Read exactly the rows and columns you need.", "SELECT,WHERE,ORDER BY", 18, "1", "Write 15 filtering and sorting queries.", "SELECT::Projection, aliases and expressions|Filtering::WHERE, comparison, IN, BETWEEN and LIKE|Ordering and limits::ORDER BY, LIMIT/OFFSET and null ordering"},
                        {"Joins", "Combine related data correctly.", "INNER JOIN,LEFT JOIN", 20, "2", "Write queries using every join type.", "Inner joins::Matching rows across tables|Outer joins::LEFT, RIGHT and FULL with missing matches|Self joins::Hierarchies and comparisons within a table"},
                        {"Aggregation and Grouping", "Summarise data and filter aggregated results.", "GROUP BY,HAVING", 18, "3", "Produce reports with counts, sums and averages.", "Aggregate functions::COUNT, SUM, AVG, MIN and MAX|Grouping::GROUP BY and HAVING|Conditional aggregation::CASE, FILTER and pivot-style reports"},
                        {"Subqueries and CTEs", "Break complex questions into readable steps.", "Subqueries,CTE", 18, "4", "Rewrite a nested query as a CTE.", "Subqueries::Scalar, IN, EXISTS and correlated forms|CTEs::WITH clauses and readability|Set operations::UNION, INTERSECT and EXCEPT"},
                        {"Window Functions", "Calculate running and ranked values without collapsing rows.", "Window Functions,RANK", 18, "4", "Rank customers and compute running totals.", "Window basics::PARTITION BY and ORDER BY|Ranking::ROW_NUMBER, RANK and DENSE_RANK|Frames::Running totals, moving averages and lag/lead"},
                        {"Schema Design and Normalisation", "Design schemas that stay correct as they grow.", "Normalisation,Constraints", 16, "1", "Normalise a messy spreadsheet into tables.", "Normal forms::1NF, 2NF, 3NF and practical denormalisation|Constraints::NOT NULL, CHECK, UNIQUE and foreign keys|Change safety::Migrations and backward-compatible changes"},
                        {"Indexes and Optimisation", "Make queries fast with evidence, not guesses.", "Indexes,EXPLAIN", 18, "7", "Add an index and compare query plans.", "Index types::B-tree, composite and covering indexes|Query plans::EXPLAIN, scans and join strategies|Optimisation::Sargable predicates, statistics and cardinality"},
                        {"Transactions and Reliability", "Keep data consistent under failure and concurrency.", "Transactions,ACID,Isolation", 16, "7", "Demonstrate commit, rollback and isolation behaviour.", "Transactions::BEGIN, COMMIT and ROLLBACK|ACID and isolation::Dirty reads, phantom reads and locking|Recovery::Backups, constraints and safe migrations"}
                });

        roadmap("android-developer", "Android Developer",
                "Build modern Android apps with Kotlin, Compose and clean architecture.",
                "Covers language basics, Android lifecycle, Compose UI, navigation, networking, "
                        + "persistence, testing and release fundamentals.",
                "Mobile", "Intermediate", 240,
                "Kotlin,Android,Jetpack Compose,Navigation,REST,Persistence",
                "AN", "from-green-500 to-emerald-400", 6,
                new Object[][]{
                        {"Kotlin Fundamentals", "Learn the language used by modern Android.", "Kotlin,Syntax,OOP", 24, "", "Build a small Kotlin console app.", "Kotlin basics::Val/var, null safety and types|Functions and classes::Data classes, sealed classes and extension functions|Coroutines::Suspend functions and structured concurrency"},
                        {"Android Platform", "Understand app components and the lifecycle.", "Android,Lifecycle,Manifest", 22, "1", "Explain the lifecycle of an activity and a process.", "App components::Activities, services, receivers and providers|Lifecycle::State changes, configuration changes and saved state|Project structure::Gradle, manifest and resources"},
                        {"Jetpack Compose UI", "Build declarative, responsive screens.", "Compose,UI,State", 28, "1", "Build a list-detail screen in Compose.", "Composables::Layout, modifiers and theming|State::remember, state hoisting and recomposition|Lists and forms::LazyColumn, inputs and validation"},
                        {"Navigation and Architecture", "Structure features with clear boundaries.", "Navigation,MVVM,ViewModel", 26, "3", "Implement navigation with a shared ViewModel.", "Navigation::Routes, arguments and back stack|MVVM::ViewModel, UI state and events|Dependency injection::Hilt basics and scopes"},
                        {"Networking and APIs", "Load remote data safely.", "Retrofit,REST,Coroutines", 24, "1", "Consume a REST API with loading and error states.", "HTTP clients::Retrofit, serialisation and timeouts|Async work::Coroutines, flows and cancellation|Error handling::Retries, offline states and user feedback"},
                        {"Persistence", "Store data locally and keep it in sync.", "Room,DataStore", 20, "5", "Cache API results in Room.", "Room::Entities, DAOs, queries and migrations|Preferences::DataStore and lightweight settings|Offline strategy::Single source of truth and sync"},
                        {"Testing", "Verify UI and business logic.", "JUnit,Compose Testing", 18, "4,5", "Write a ViewModel test and a Compose UI test.", "Unit tests::ViewModel and repository tests|UI tests::Compose semantics and test rules|Quality::Lint, static analysis and CI"},
                        {"Release", "Prepare, sign and publish an app.", "Signing,Play Store", 16, "6,7", "Produce a signed release build.", "Build types::Debug, release and ProGuard/R8|Signing::Keystore and Play App Signing|Release checklist::Versioning, privacy and store listing"}
                });

        roadmap("devops-fundamentals", "DevOps Fundamentals",
                "Linux, Git, CI/CD, containers and deployment essentials.",
                "A practical operations path for developers who need to ship and support software. "
                        + "Focuses on repeatable builds, containers, pipelines and monitoring.",
                "DevOps", "Beginner", 160,
                "Linux,Git,CI/CD,Docker,Cloud,Monitoring",
                "DO", "from-sky-500 to-indigo-400", 7,
                new Object[][]{
                        {"Linux and Networking", "Work comfortably on a server.", "Linux,Shell,Networking", 20, "", "Complete 20 command-line exercises.", "Shell basics::Files, permissions, processes and pipes|Networking::DNS, ports, HTTP and firewalls|Troubleshooting::Logs, curl and resource inspection"},
                        {"Git and Collaboration", "Manage change safely across a team.", "Git,Branches,Reviews", 14, "1", "Resolve a merge conflict and open a pull request.", "Git model::Commits, branches and remotes|Collaboration::Pull requests, reviews and protected branches|Recovery::Revert, reset vs restore and conflict resolution"},
                        {"Build and CI", "Automate builds and checks.", "CI,Maven,npm", 18, "2", "Create a pipeline that builds and tests.", "Build tools::Maven, npm and reproducible builds|Pipelines::Stages, caching and artifacts|Quality gates::Tests, lint and security scans"},
                        {"Containers", "Package applications with Docker.", "Docker,Images,Compose", 24, "3", "Containerise a backend and a database.", "Images::Dockerfiles, layers and multi-stage builds|Runtime::Ports, volumes, networks and environment|Compose::Local multi-service environments"},
                        {"Cloud and Deployment", "Run services on managed infrastructure.", "Cloud,Hosting,Config", 22, "4", "Deploy a container to a managed host.", "Hosting models::VMs, PaaS and containers|Configuration::Secrets, environment variables and regions|Release safety::Rollouts, health checks and rollback"},
                        {"Monitoring and Logging", "Know when something breaks.", "Monitoring,Logs,Alerts", 18, "5", "Add health checks and a basic alert.", "Logs::Structured logging and retention|Metrics::Latency, errors, saturation and dashboards|Alerts::Thresholds, routing and on-call basics"},
                        {"Infrastructure as Code", "Make environments reproducible.", "Terraform,Automation", 20, "5", "Describe one environment as code.", "IaC concepts::Declarative state and drift|Terraform basics::Providers, resources and plans|Safety::Review, state locking and change windows"},
                        {"Reliability Practices", "Design for failure.", "Backups,Scaling,Incidents", 16, "6,7", "Write a runbook for a failed deployment.", "Backups::Restore drills and retention|Scaling::Stateless services and bottlenecks|Incidents::Triage, communication and postmortems"}
                });
    }

    private void roadmap(String slug, String title, String shortDescription, String description,
                         String category, String difficulty, int hours, String skills,
                         String icon, String accent, int sortOrder, Object[][] stages) {
        if (roadmapRepository.findBySlug(slug).isPresent()) return;
        Roadmap roadmap = roadmapRepository.save(Roadmap.builder()
                .slug(slug).title(title).shortDescription(shortDescription).description(description)
                .category(category).difficulty(difficulty).estimatedHours(hours).skills(skills)
                .icon(icon).accent(accent).sortOrder(sortOrder).active(true).build());
        int order = 1;
        for (Object[] row : stages) {
            int stageHours = Integer.parseInt(String.valueOf(row[3]));
            RoadmapStage stage = stageRepository.save(RoadmapStage.builder()
                    .roadmap(roadmap).stageOrder(order).title(String.valueOf(row[0]))
                    .description(String.valueOf(row[1]))
                    .skills(String.valueOf(row[2])).estimatedHours(stageHours)
                    .prerequisiteOrders(String.valueOf(row[4])).completionCriteria(String.valueOf(row[5])).build());
            int topicOrder = 1;
            for (String raw : String.valueOf(row[6]).split("\\|")) {
                String[] parts = raw.split("::");
                String topicTitle = parts[0].trim();
                String topicDescription = parts.length > 1 ? parts[1].trim()
                        : "Study " + topicTitle + " and complete the linked practice.";
                topicRepository.save(RoadmapTopic.builder()
                        .stage(stage).topicOrder(topicOrder++).title(topicTitle)
                        .description(topicDescription)
                        .resourceTitle("CodeVerse practice")
                        .resourceUrl("/problems")
                        .estimatedMinutes(Math.max(20, (stageHours * 60) / 3))
                        .build());
            }
            order++;
        }
    }

    // ------------------------------------------------------------------
    // Courses
    // ------------------------------------------------------------------

    private void seedCourses() {
        course("java-foundations", "Java Foundations",
                "Learn Java from types and control flow to OOP, collections and exceptions.",
                "A hands-on introduction to Java. Each module combines a short explanation, a runnable "
                        + "example, an exercise and a quiz so progress is based on real lesson completion.",
                "Programming", "Beginner", "Beginner", 420,
                "Variables, control flow, methods, arrays, OOP, collections, exceptions",
                "Write Java programs, model objects and handle errors",
                "Basic computer literacy",
                "Java syntax, OOP, collections, exception handling",
                new String[][]{
                        {"Java Basics", "1", "1", "Variables and Data Types",
                                "Primitive types, reference types and type conversion.",
                                "Java is statically typed: every variable has a declared type. Primitive types store values directly (int, long, double, boolean, char), while reference types point to objects such as String and arrays.\n\nUse int for whole numbers, long when values may exceed 2^31-1, double for decimals and boolean for flags. Prefer descriptive names and declare variables close to where they are used.\n\nCasting converts between numeric types. Widening (int to long) is implicit; narrowing (long to int) requires an explicit cast and can lose data.",
                                "int age = 21;\nlong views = 4_000_000_000L;\ndouble price = 19.99;\nboolean active = true;\nchar grade = 'A';\n\nint rounded = (int) price; // 19\nSystem.out.println(age + \" \" + views + \" \" + rounded);",
                                "21 4000000000 19",
                                "Declare variables for a product name, price, quantity and availability, then print a one-line summary.",
                                "[{\"question\":\"Which type should store a whole number larger than 2^31-1?\",\"options\":[\"int\",\"long\",\"float\",\"short\"],\"answer\":1},{\"question\":\"What does (int) 9.99 evaluate to?\",\"options\":[\"10\",\"9\",\"9.99\",\"error\"],\"answer\":1}]",
                                "Choose appropriate primitive types; use explicit casts safely",
                                "Using float for money, forgetting the L suffix on large long literals",
                                "A small program that prints typed product information."},
                        {"Java Basics", "1", "2", "Operators and Conditions",
                                "Arithmetic, comparison, logical operators and if/switch decisions.",
                                "Operators combine values. Arithmetic operators follow precedence, comparison operators return boolean, and logical operators combine conditions with short-circuit evaluation.\n\nif/else handles branching; switch expressions (Java 14+) return a value and are clearer for fixed option sets. Always guard against invalid input before dividing or indexing.",
                                "int score = 82;\nString grade = score >= 90 ? \"A\" : score >= 75 ? \"B\" : \"C\";\n\nString label = switch (grade) {\n    case \"A\" -> \"Outstanding\";\n    case \"B\" -> \"Strong\";\n    default -> \"Keep practising\";\n};\nSystem.out.println(grade + \": \" + label);",
                                "B: Strong",
                                "Write a program that prints a ticket price category based on age and whether the visitor is a student.",
                                "[{\"question\":\"Which operator checks equality of primitive values?\",\"options\":[\"=\",\"==\",\"equals\",\"!=\"],\"answer\":1},{\"question\":\"What is short-circuit evaluation?\",\"options\":[\"Both sides always run\",\"The right side may be skipped\",\"Only the right side runs\",\"It compiles faster\"],\"answer\":1}]",
                                "Combine conditions safely and use switch expressions",
                                "Using = instead of ==, ignoring operator precedence",
                                "A program that classifies inputs with clear conditions."},
                        {"Java Basics", "1", "3", "Loops and Arrays",
                                "Iterate with for/while and store sequences in arrays.",
                                "Loops repeat work. Use for when the number of iterations is known, while when it depends on a condition, and enhanced for to read every element of an array or collection.\n\nArrays have a fixed length and zero-based indexes. Accessing an index outside 0..length-1 throws ArrayIndexOutOfBoundsException. Validate indexes before access.",
                                "int[] scores = {72, 88, 95, 61};\nint total = 0;\nfor (int score : scores) {\n    total += score;\n}\ndouble average = (double) total / scores.length;\nSystem.out.printf(\"Average: %.1f%n\", average);",
                                "Average: 79.0",
                                "Given an array of prices, print the highest price and the average, then reverse the array in place.",
                                "[{\"question\":\"What is the last valid index of an array of length 5?\",\"options\":[\"5\",\"4\",\"6\",\"0\"],\"answer\":1},{\"question\":\"Which loop is best for reading every array element?\",\"options\":[\"for (int i=0;i<10;i++)\",\"while(true)\",\"enhanced for\",\"do-while\"],\"answer\":2}]",
                                "Iterate arrays safely and compute aggregates",
                                "Off-by-one index errors, integer division when averaging",
                                "A program that aggregates and reverses an array."},
                        {"Java Basics", "1", "4", "Methods and Parameters",
                                "Break programs into reusable, testable methods.",
                                "Methods name a unit of behaviour. A method declares a return type, a name and typed parameters. void means no value is returned. Parameters are passed by value: primitives copy the value, object references copy the reference.\n\nKeep methods small, avoid hidden global state and return early for invalid input. Overloading lets several methods share a name when their parameter lists differ.",
                                "static double average(int[] values) {\n    if (values.length == 0) return 0;\n    int sum = 0;\n    for (int value : values) sum += value;\n    return (double) sum / values.length;\n}\n\nSystem.out.println(average(new int[]{10, 20, 31}));",
                                "20.333333333333332",
                                "Write methods max(int[]), min(int[]) and contains(int[], int) and use them in main.",
                                "[{\"question\":\"What does void mean in a method signature?\",\"options\":[\"It returns null\",\"It returns nothing\",\"It is abstract\",\"It is private\"],\"answer\":1},{\"question\":\"Java passes primitive arguments by...\",\"options\":[\"reference\",\"value\",\"pointer\",\"name\"],\"answer\":1}]",
                                "Design small methods with clear contracts",
                                "Mutating shared arrays unexpectedly, forgetting empty-input cases",
                                "A utility class with tested helper methods."},
                        {"Object Oriented Java", "2", "1", "Classes, Objects and Encapsulation",
                                "Model state and behaviour with classes and keep invariants safe.",
                                "A class defines fields (state) and methods (behaviour). Objects are instances. Encapsulation means fields are private and access goes through methods that preserve invariants.\n\nConstructors initialise objects. Validate parameters in the constructor so an invalid object cannot exist. toString() improves debugging and records can model immutable data.",
                                "public class BankAccount {\n    private double balance;\n\n    public BankAccount(double opening) {\n        if (opening < 0) throw new IllegalArgumentException(\"negative\");\n        this.balance = opening;\n    }\n\n    public void deposit(double amount) {\n        if (amount <= 0) throw new IllegalArgumentException(\"amount\");\n        balance += amount;\n    }\n\n    public double getBalance() { return balance; }\n}",
                                "new BankAccount(100).deposit(50) leaves balance 150",
                                "Create a Product class with validated price and quantity, a restock method and a totalValue method.",
                                "[{\"question\":\"Encapsulation primarily means...\",\"options\":[\"All fields public\",\"State is protected by methods\",\"Using inheritance\",\"Avoiding constructors\"],\"answer\":1},{\"question\":\"Where should invariants be enforced?\",\"options\":[\"Only in the UI\",\"In constructors and mutators\",\"In toString\",\"Nowhere\"],\"answer\":1}]",
                                "Protect object invariants with encapsulation",
                                "Public mutable fields, constructors that accept invalid data",
                                "A validated domain class with behaviour."},
                        {"Object Oriented Java", "2", "2", "Inheritance and Polymorphism",
                                "Share behaviour and choose implementations at runtime.",
                                "Inheritance expresses an is-a relationship. A subclass can reuse and override behaviour. Polymorphism lets code depend on a base type and work with any implementation.\n\nPrefer composition when the relationship is has-a. Mark methods @Override to catch signature mistakes. Abstract classes share state; interfaces define capability.",
                                "interface Shape { double area(); }\n\nclass Circle implements Shape {\n    private final double r;\n    Circle(double r) { this.r = r; }\n    public double area() { return Math.PI * r * r; }\n}\n\nShape shape = new Circle(2);\nSystem.out.printf(\"%.2f%n\", shape.area());",
                                "12.57",
                                "Create an interface Payment with pay(double) and two implementations, then process a list of payments polymorphically.",
                                "[{\"question\":\"Which keyword implements an interface?\",\"options\":[\"extends\",\"implements\",\"inherits\",\"with\"],\"answer\":1},{\"question\":\"Polymorphism allows...\",\"options\":[\"One type, many forms\",\"Only static methods\",\"Faster compilation\",\"Multiple inheritance of classes\"],\"answer\":0}]",
                                "Use interfaces and overriding to remove conditionals",
                                "Deep inheritance trees, forgetting @Override",
                                "A polymorphic payment workflow."},
                        {"Object Oriented Java", "2", "3", "Collections and Generics",
                                "Choose the right collection and use type-safe generics.",
                                "The Java Collections Framework provides List, Set, Map and Queue. ArrayList is a resizable array; LinkedList is better for frequent head operations; HashSet gives fast membership; TreeSet keeps order; HashMap maps keys to values.\n\nGenerics make collections type-safe and remove casts. Choose by required ordering, duplicates and lookup complexity.",
                                "import java.util.*;\n\nMap<String, Integer> stock = new HashMap<>();\nstock.put(\"keyboard\", 12);\nstock.merge(\"keyboard\", 3, Integer::sum);\n\nList<String> names = new ArrayList<>(List.of(\"Ada\", \"Linus\"));\nnames.sort(Comparator.naturalOrder());\nSystem.out.println(stock.get(\"keyboard\") + \" \" + names);",
                                "15 [Ada, Linus]",
                                "Count word frequencies in a sentence with a HashMap and print the top three words.",
                                "[{\"question\":\"Which collection forbids duplicate elements?\",\"options\":[\"List\",\"Set\",\"Map values\",\"Array\"],\"answer\":1},{\"question\":\"What is the average lookup complexity of HashMap?\",\"options\":[\"O(1)\",\"O(n)\",\"O(log n)\",\"O(n log n)\"],\"answer\":0}]",
                                "Select collections by ordering, uniqueness and complexity",
                                "Using List for membership tests, raw types without generics",
                                "A frequency counter using maps and sorting."},
                        {"Collections and Exceptions", "3", "1", "Exception Handling",
                                "Fail clearly, recover deliberately and never swallow errors.",
                                "Exceptions signal abnormal conditions. Checked exceptions must be handled or declared; unchecked exceptions usually indicate programming errors. Catch the most specific type, log useful context and either recover or rethrow.\n\ntry-with-resources closes resources automatically. Never use an empty catch block, and do not use exceptions for ordinary control flow.",
                                "static int parse(String value) {\n    try {\n        return Integer.parseInt(value);\n    } catch (NumberFormatException ex) {\n        throw new IllegalArgumentException(\"Not a number: \" + value, ex);\n    }\n}\n\nSystem.out.println(parse(\"42\"));",
                                "42",
                                "Write a method that reads numbers from a list of strings, skips invalid values and reports how many were skipped.",
                                "[{\"question\":\"Which block always runs?\",\"options\":[\"try\",\"catch\",\"finally\",\"throw\"],\"answer\":2},{\"question\":\"What should an empty catch block be replaced with?\",\"options\":[\"Nothing\",\"Logging or rethrowing\",\"System.exit\",\"A loop\"],\"answer\":1}]",
                                "Handle exceptions with context and preserve causes",
                                "Swallowing exceptions, catching Exception too broadly",
                                "A parser that reports invalid input without crashing."},
                        {"Collections and Exceptions", "3", "2", "Streams and Lambdas",
                                "Process collections declaratively with the Stream API.",
                                "Streams express pipelines: source, intermediate operations (filter, map, sorted) and a terminal operation (collect, count, reduce). They do not modify the source.\n\nUse streams when they make intent clearer. Keep lambdas short, avoid side effects and prefer method references where readable.",
                                "import java.util.*;\nimport java.util.stream.*;\n\nList<String> names = List.of(\"ada\", \"linus\", \"grace\", \"alan\");\nList<String> result = names.stream()\n        .filter(n -> n.length() > 3)\n        .map(String::toUpperCase)\n        .sorted()\n        .collect(Collectors.toList());\nSystem.out.println(result);",
                                "[ALAN, GRACE, LINUS]",
                                "Given a list of orders, compute total revenue for delivered orders and the average order value.",
                                "[{\"question\":\"Which is a terminal operation?\",\"options\":[\"filter\",\"map\",\"collect\",\"sorted\"],\"answer\":2},{\"question\":\"Streams modify the original collection.\",\"options\":[\"True\",\"False\"],\"answer\":1}]",
                                "Build readable stream pipelines",
                                "Reusing a consumed stream, hiding complex logic in huge lambdas",
                                "A reporting method built from a stream pipeline."},
                        {"Collections and Exceptions", "3", "3", "Mini Project: Student Tracker",
                                "Combine classes, collections, streams and exceptions in one small application.",
                                "Build a console application that stores students, records scores, computes averages and reports the top performer. Validate input, use a Map for lookup and streams for reporting.\n\nThis project is intentionally small but complete: model, storage, operations, validation and output.",
                                "record Student(String name, List<Integer> scores) {\n    double average() {\n        return scores.stream().mapToInt(Integer::intValue).average().orElse(0);\n    }\n}\n\nList<Student> students = List.of(\n        new Student(\"Ada\", List.of(90, 95)),\n        new Student(\"Linus\", List.of(70, 80)));\nstudents.stream()\n        .max(Comparator.comparingDouble(Student::average))\n        .ifPresent(s -> System.out.println(s.name()));",
                                "Ada",
                                "Extend the tracker with add, remove, search by name and a report grouped by grade band.",
                                "[{\"question\":\"Which type gives fast lookup by student name?\",\"options\":[\"List\",\"Map\",\"Array\",\"Queue\"],\"answer\":1},{\"question\":\"Which operation finds the maximum average?\",\"options\":[\"filter\",\"max\",\"collect\",\"flatMap\"],\"answer\":1}]",
                                "Combine language features into a coherent program",
                                "Mixing input parsing with domain logic",
                                "A working student tracker with reports."}
                });

        course("dsa-essentials", "DSA Essentials",
                "Arrays, strings, searching, sorting, hashing and core data structures.",
                "A practice-first DSA course. Each lesson explains a pattern, shows a Java implementation, "
                        + "states complexity and gives a graded exercise so you can apply it immediately.",
                "DSA", "Intermediate", "Intermediate", 480,
                "Complexity, arrays, strings, hashing, linked lists, stacks, queues, trees",
                "Analyse complexity and implement core data structures",
                "Java basics",
                "Big O, arrays, hashing, linked structures, trees",
                new String[][]{
                        {"Complexity", "1", "1", "Time and Space Complexity",
                                "Measure growth instead of counting operations.",
                                "Big O describes how runtime or memory grows as input size grows. Drop constants and lower-order terms: 3n + 7 becomes O(n).\n\nCommon classes: O(1) constant, O(log n) binary search, O(n) linear scan, O(n log n) efficient sorting, O(n^2) nested loops and O(2^n) naive recursion. Space complexity counts auxiliary memory, including recursion stacks.",
                                "// O(n) time, O(1) space\nstatic int sum(int[] values) {\n    int total = 0;\n    for (int value : values) total += value;\n    return total;\n}",
                                "Linear time, constant extra space",
                                "State the time and space complexity of reversing an array, checking duplicates with a set, and printing all pairs.",
                                "[{\"question\":\"Binary search on a sorted array is...\",\"options\":[\"O(1)\",\"O(log n)\",\"O(n)\",\"O(n log n)\"],\"answer\":1},{\"question\":\"Nested loops over the same array are typically...\",\"options\":[\"O(n)\",\"O(log n)\",\"O(n^2)\",\"O(1)\"],\"answer\":2}]",
                                "Derive complexity from loops and recursion",
                                "Counting statements instead of growth, ignoring recursion stack space",
                                "A short complexity analysis for three snippets."},
                        {"Arrays and Strings", "2", "1", "Two Pointers and Sliding Window",
                                "Solve contiguous and paired problems in linear time.",
                                "Two pointers move from both ends or at different speeds. Sliding window maintains a range and updates it incrementally instead of recomputing.\n\nThese patterns turn many O(n^2) scans into O(n). The key is proving that the pointer movement never skips a valid answer.",
                                "static int longestUnique(String s) {\n    int[] last = new int[128];\n    java.util.Arrays.fill(last, -1);\n    int best = 0, start = 0;\n    for (int end = 0; end < s.length(); end++) {\n        start = Math.max(start, last[s.charAt(end)] + 1);\n        best = Math.max(best, end - start + 1);\n        last[s.charAt(end)] = end;\n    }\n    return best;\n}",
                                "longestUnique(\"abcabcbb\") = 3",
                                "Implement a function that returns the maximum sum of any subarray of length k.",
                                "[{\"question\":\"A variable sliding window usually runs in...\",\"options\":[\"O(n^2)\",\"O(n)\",\"O(log n)\",\"O(2^n)\"],\"answer\":1},{\"question\":\"Two pointers require which property for the sorted pair problem?\",\"options\":[\"Random order\",\"Sorted order\",\"Duplicates\",\"Negative values\"],\"answer\":1}]",
                                "Recognise and implement window patterns",
                                "Moving the left pointer backwards, recomputing the window from scratch",
                                "A fixed-window maximum sum solution."},
                        {"Arrays and Strings", "2", "2", "Hashing Patterns",
                                "Use maps and sets for frequency, grouping and lookup.",
                                "Hashing gives average O(1) insert and lookup. Common patterns: frequency counts, seen-set for duplicates, grouping by a computed key and prefix-sum lookup.\n\nChoose a key that uniquely represents the state you need to remember. For prefix sums, store the earliest index for each running sum.",
                                "static int[] twoSum(int[] nums, int target) {\n    java.util.Map<Integer, Integer> seen = new java.util.HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n        int need = target - nums[i];\n        if (seen.containsKey(need)) return new int[]{seen.get(need), i};\n        seen.put(nums[i], i);\n    }\n    return new int[]{-1, -1};\n}",
                                "twoSum([2,7,11,15], 9) = [0,1]",
                                "Group an array of words by their sorted character signature.",
                                "[{\"question\":\"Average HashMap lookup time is...\",\"options\":[\"O(1)\",\"O(log n)\",\"O(n)\",\"O(n^2)\"],\"answer\":0},{\"question\":\"Prefix sum plus a map can find...\",\"options\":[\"Subarrays with a target sum\",\"Only sorted arrays\",\"Tree height\",\"Graph cycles\"],\"answer\":0}]",
                                "Turn nested scans into hash lookups",
                                "Using mutable keys, forgetting to store the index",
                                "A grouping solution using computed keys."},
                        {"Searching and Sorting", "3", "1", "Binary Search",
                                "Search ordered data and answer spaces in logarithmic time.",
                                "Binary search repeatedly halves a sorted range. Use inclusive/exclusive bounds consistently to avoid infinite loops.\n\nThe pattern also applies to answer-space problems: when a predicate is monotonic, binary search the smallest value that satisfies it.",
                                "static int lowerBound(int[] a, int target) {\n    int lo = 0, hi = a.length;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (a[mid] < target) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}",
                                "lowerBound([1,3,3,5], 3) = 1",
                                "Implement upperBound and use it to count occurrences of a value.",
                                "[{\"question\":\"Binary search requires...\",\"options\":[\"Random data\",\"Sorted data\",\"Unique data\",\"Negative data\"],\"answer\":1},{\"question\":\"The safe midpoint formula is...\",\"options\":[\"(lo+hi)/2\",\"lo+(hi-lo)/2\",\"lo-hi\",\"hi-lo\"],\"answer\":1}]",
                                "Write correct bound-based binary search",
                                "Infinite loops from inconsistent bounds, overflow in midpoint",
                                "A lower/upper bound implementation with tests."},
                        {"Searching and Sorting", "3", "2", "Sorting Algorithms",
                                "Understand comparison sorting and stability.",
                                "Merge sort divides, sorts and merges in O(n log n) with O(n) extra space. Quick sort partitions in place and averages O(n log n) but degrades to O(n^2) on bad pivots.\n\nJava's Arrays.sort uses dual-pivot quicksort for primitives and TimSort for objects. Stability matters when equal keys must preserve input order.",
                                "static void mergeSort(int[] a, int lo, int hi) {\n    if (hi - lo <= 1) return;\n    int mid = (lo + hi) / 2;\n    mergeSort(a, lo, mid);\n    mergeSort(a, mid, hi);\n    int[] tmp = new int[hi - lo];\n    int i = lo, j = mid, k = 0;\n    while (i < mid && j < hi) tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];\n    while (i < mid) tmp[k++] = a[i++];\n    while (j < hi) tmp[k++] = a[j++];\n    System.arraycopy(tmp, 0, a, lo, tmp.length);\n}",
                                "Sorts in O(n log n) time",
                                "Implement insertion sort and compare its behaviour on nearly sorted data.",
                                "[{\"question\":\"Merge sort worst-case time is...\",\"options\":[\"O(n)\",\"O(n log n)\",\"O(n^2)\",\"O(log n)\"],\"answer\":1},{\"question\":\"Which sort is stable?\",\"options\":[\"Quick sort\",\"Merge sort\",\"Heap sort\",\"Selection sort\"],\"answer\":1}]",
                                "Choose sorting algorithms by complexity and stability",
                                "Assuming quicksort is always O(n log n)",
                                "A working merge sort with complexity notes."},
                        {"Data Structures", "4", "1", "Linked Lists, Stacks and Queues",
                                "Implement pointer-based and LIFO/FIFO structures.",
                                "A linked list stores nodes with a value and next reference. Insertion at the head is O(1); indexed access is O(n). Reversal uses three pointers.\n\nStacks support push/pop in O(1) and power DFS, matching and expression evaluation. Queues support enqueue/dequeue and power BFS and scheduling.",
                                "static Node reverse(Node head) {\n    Node prev = null;\n    while (head != null) {\n        Node next = head.next;\n        head.next = prev;\n        prev = head;\n        head = next;\n    }\n    return prev;\n}\n\nrecord Node(int value, Node next) {}",
                                "Returns the reversed list head",
                                "Use an ArrayDeque to check whether a string of brackets is balanced.",
                                "[{\"question\":\"Which structure is FIFO?\",\"options\":[\"Stack\",\"Queue\",\"Set\",\"Tree\"],\"answer\":1},{\"question\":\"Reversing a linked list uses how many pointers?\",\"options\":[\"1\",\"2\",\"3\",\"4\"],\"answer\":2}]",
                                "Implement linked and LIFO/FIFO operations",
                                "Losing the next node during reversal, using Stack for BFS",
                                "A bracket validator and list reversal."},
                        {"Data Structures", "4", "2", "Trees and Traversals",
                                "Traverse and query hierarchical data.",
                                "A binary tree node has left and right children. Traversals: preorder (node, left, right), inorder (left, node, right), postorder (left, right, node) and level order (BFS with a queue).\n\nIn a BST, inorder traversal is sorted. Recursive solutions are concise; iterative versions avoid stack overflow on deep trees.",
                                "static int height(TreeNode node) {\n    if (node == null) return 0;\n    return 1 + Math.max(height(node.left), height(node.right));\n}\n\nrecord TreeNode(int value, TreeNode left, TreeNode right) {}",
                                "Height of an empty tree is 0",
                                "Implement level-order traversal and return the maximum value on each level.",
                                "[{\"question\":\"Which traversal visits a BST in sorted order?\",\"options\":[\"Preorder\",\"Inorder\",\"Postorder\",\"Level order\"],\"answer\":1},{\"question\":\"Level-order traversal uses a...\",\"options\":[\"Stack\",\"Queue\",\"Set\",\"Map\"],\"answer\":1}]",
                                "Traverse trees recursively and iteratively",
                                "Confusing height with depth, ignoring null children",
                                "A level-order report for a binary tree."},
                        {"Data Structures", "4", "3", "Graphs and BFS/DFS",
                                "Model relationships and search them.",
                                "Represent graphs as adjacency lists. BFS explores by distance using a queue; DFS explores deeply using recursion or a stack. Track visited nodes to avoid cycles.\n\nTopological sort orders a DAG. Dijkstra finds shortest paths with non-negative weights.",
                                "static void bfs(Map<Integer, List<Integer>> g, int start) {\n    var visited = new java.util.HashSet<Integer>();\n    var queue = new java.util.ArrayDeque<Integer>();\n    visited.add(start);\n    queue.add(start);\n    while (!queue.isEmpty()) {\n        int node = queue.poll();\n        System.out.print(node + \" \");\n        for (int next : g.getOrDefault(node, List.of())) {\n            if (visited.add(next)) queue.add(next);\n        }\n    }\n}",
                                "Prints nodes in BFS order",
                                "Implement DFS iteratively and count connected components.",
                                "[{\"question\":\"BFS uses which structure?\",\"options\":[\"Stack\",\"Queue\",\"Heap\",\"Set\"],\"answer\":1},{\"question\":\"Why track visited nodes?\",\"options\":[\"To sort\",\"To avoid cycles and repeated work\",\"To save memory\",\"To find keys\"],\"answer\":1}]",
                                "Implement graph traversal with visited state",
                                "Revisiting nodes, recursion depth on large graphs",
                                "A component counter using BFS."}
                });

        course("sql-mastery", "SQL Mastery",
                "Query, join, aggregate and optimise relational data.",
                "Practical SQL for application developers. Every lesson uses a realistic schema, shows a query, "
                        + "explains the result and asks you to write a variation.",
                "Database", "Beginner", "Beginner", 300,
                "SELECT, joins, aggregation, subqueries, CTEs, indexes",
                "Write correct analytical SQL and design sane schemas",
                "No prior SQL required",
                "SQL querying, joins, reporting, indexes",
                new String[][]{
                        {"Query Basics", "1", "1", "SELECT, WHERE and ORDER BY",
                                "Read exactly the rows and columns you need.",
                                "SELECT chooses columns, FROM chooses the table, WHERE filters rows and ORDER BY sorts. Use explicit column lists instead of SELECT * in application queries.\n\nComparison operators include =, <>, >, <, IN, BETWEEN and LIKE. NULL is unknown: test it with IS NULL, never = NULL.",
                                "SELECT name, price\nFROM products\nWHERE price BETWEEN 10 AND 50\n  AND category = 'books'\nORDER BY price DESC\nLIMIT 5;",
                                "Up to five books priced 10-50, most expensive first",
                                "List active customers created in the last 30 days, newest first.",
                                "[{\"question\":\"How do you test for NULL?\",\"options\":[\"= NULL\",\"IS NULL\",\"== NULL\",\"NULL()\"],\"answer\":1},{\"question\":\"Which clause filters rows?\",\"options\":[\"SELECT\",\"WHERE\",\"ORDER BY\",\"GROUP BY\"],\"answer\":1}]",
                                "Filter, sort and limit rows correctly",
                                "Using = NULL, relying on implicit ordering",
                                "A filtered, sorted customer query."},
                        {"Query Basics", "1", "2", "Joins",
                                "Combine rows across related tables.",
                                "INNER JOIN returns matching rows. LEFT JOIN keeps all left rows and fills missing right columns with NULL. Use aliases and join on indexed keys.\n\nA join condition belongs in ON; a filter on the preserved side belongs in WHERE. Filtering the optional side in WHERE can turn a LEFT JOIN into an inner join.",
                                "SELECT c.name, COUNT(o.id) AS orders\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.name\nORDER BY orders DESC;",
                                "Every customer with their order count, including zero",
                                "List products with their category name and supplier, including products without a supplier.",
                                "[{\"question\":\"Which join keeps unmatched left rows?\",\"options\":[\"INNER\",\"LEFT\",\"CROSS\",\"SELF\"],\"answer\":1},{\"question\":\"What fills missing right-side columns?\",\"options\":[\"0\",\"Empty string\",\"NULL\",\"The join fails\"],\"answer\":2}]",
                                "Choose join types intentionally",
                                "Filtering the optional table in WHERE",
                                "A left-join report including zero counts."},
                        {"Query Basics", "1", "3", "Aggregation and Grouping",
                                "Summarise data with aggregate functions.",
                                "COUNT, SUM, AVG, MIN and MAX summarise groups. GROUP BY defines the groups; HAVING filters groups after aggregation. Every non-aggregated selected column must be grouped.\n\nCOUNT(*) counts rows; COUNT(column) ignores NULL. Use conditional aggregation with CASE for multi-metric reports.",
                                "SELECT category,\n       COUNT(*) AS products,\n       ROUND(AVG(price), 2) AS avg_price\nFROM products\nGROUP BY category\nHAVING COUNT(*) >= 3\nORDER BY avg_price DESC;",
                                "Categories with at least three products",
                                "Report monthly revenue and the number of distinct customers per month.",
                                "[{\"question\":\"Which clause filters groups?\",\"options\":[\"WHERE\",\"HAVING\",\"ORDER BY\",\"LIMIT\"],\"answer\":1},{\"question\":\"COUNT(column) ignores...\",\"options\":[\"Zero\",\"NULL\",\"Duplicates\",\"Text\"],\"answer\":1}]",
                                "Build grouped reports with HAVING",
                                "Filtering aggregates in WHERE",
                                "A monthly revenue report."},
                        {"Advanced SQL", "2", "1", "Subqueries and CTEs",
                                "Break complex questions into readable steps.",
                                "A subquery can return a scalar, a list or an existence test. CTEs (WITH) name intermediate results and make long queries readable.\n\nPrefer EXISTS for existence checks and CTEs for multi-step reports. Window functions often replace correlated subqueries for ranking.",
                                "WITH monthly AS (\n  SELECT DATE_TRUNC('month', created_at) AS month, SUM(total) AS revenue\n  FROM orders\n  GROUP BY 1\n)\nSELECT month, revenue,\n       revenue - LAG(revenue) OVER (ORDER BY month) AS change\nFROM monthly\nORDER BY month;",
                                "Monthly revenue with month-over-month change",
                                "Find customers whose lifetime spend is above the average lifetime spend.",
                                "[{\"question\":\"What does WITH define?\",\"options\":[\"A table\",\"A CTE\",\"An index\",\"A trigger\"],\"answer\":1},{\"question\":\"EXISTS returns...\",\"options\":[\"A number\",\"A boolean condition\",\"A table\",\"A string\"],\"answer\":1}]",
                                "Structure multi-step SQL with CTEs",
                                "Repeating the same subquery, correlated queries that scan repeatedly",
                                "A CTE-based above-average report."},
                        {"Advanced SQL", "2", "2", "Window Functions",
                                "Rank and accumulate without collapsing rows.",
                                "Window functions compute across a set of rows while keeping each row. PARTITION BY groups, ORDER BY defines sequence and the frame controls which rows participate.\n\nROW_NUMBER, RANK and DENSE_RANK differ on ties. LAG/LEAD compare adjacent rows; SUM OVER computes running totals.",
                                "SELECT name, department, salary,\n       RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rank\nFROM employees\nORDER BY department, rank;",
                                "Salary rank within each department",
                                "Compute a running total of orders per customer ordered by date.",
                                "[{\"question\":\"Which function numbers rows with no ties?\",\"options\":[\"RANK\",\"DENSE_RANK\",\"ROW_NUMBER\",\"NTILE\"],\"answer\":2},{\"question\":\"PARTITION BY does what?\",\"options\":[\"Sorts globally\",\"Groups rows for the window\",\"Filters rows\",\"Creates a table\"],\"answer\":1}]",
                                "Use ranking and running totals",
                                "Confusing RANK with ROW_NUMBER",
                                "A per-customer running total query."},
                        {"Design and Performance", "3", "1", "Schema Design and Indexes",
                                "Design tables and indexes that support real queries.",
                                "Normalise to remove duplication, then denormalise deliberately for read performance. Primary keys identify rows; foreign keys protect relationships; unique constraints prevent duplicates.\n\nIndexes speed reads but cost writes and storage. Composite index column order matters: put equality columns first, then range/sort columns. Verify with EXPLAIN.",
                                "CREATE INDEX idx_orders_customer_created\n  ON orders (customer_id, created_at DESC);\n\nEXPLAIN SELECT * FROM orders\nWHERE customer_id = 42\nORDER BY created_at DESC\nLIMIT 20;",
                                "The plan should use the composite index",
                                "Given a slow query, propose an index and explain the expected plan change.",
                                "[{\"question\":\"Indexes primarily speed up...\",\"options\":[\"Writes\",\"Reads\",\"Backups\",\"Migrations\"],\"answer\":1},{\"question\":\"In a composite index, which column first?\",\"options\":[\"Lowest cardinality\",\"Equality filter columns\",\"The largest column\",\"Any column\"],\"answer\":1}]",
                                "Design indexes from query patterns",
                                "Indexing every column, ignoring write cost",
                                "An index proposal with EXPLAIN evidence."},
                        {"Design and Performance", "3", "2", "Transactions and Safe Changes",
                                "Keep data consistent and migrate safely.",
                                "A transaction groups statements: COMMIT persists, ROLLBACK discards. ACID guarantees atomicity, consistency, isolation and durability. Isolation levels trade consistency against concurrency.\n\nSchema changes should be backward compatible: add nullable columns, backfill, switch reads, then remove old columns later.",
                                "START TRANSACTION;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\nCOMMIT;",
                                "Both updates persist or neither does",
                                "Explain how you would add a NOT NULL column to a large live table without downtime.",
                                "[{\"question\":\"What discards a transaction?\",\"options\":[\"COMMIT\",\"ROLLBACK\",\"SELECT\",\"EXPLAIN\"],\"answer\":1},{\"question\":\"Which is a safe migration step?\",\"options\":[\"Drop a column immediately\",\"Add nullable, backfill, then enforce\",\"Rename in place\",\"Disable backups\"],\"answer\":1}]",
                                "Reason about transactions and migrations",
                                "Long-running locks, destructive one-step migrations",
                                "A migration plan with rollback notes."}
                });

        course("react-frontend", "React Frontend",
                "Build modern React interfaces and connect them to REST APIs.",
                "Component thinking, hooks, routing, forms, API integration, loading/error states and "
                        + "frontend testing. Examples use JavaScript and Vite.",
                "Frontend", "Beginner", "Beginner", 360,
                "React, JSX, hooks, routing, forms, API integration, testing",
                "Build responsive React pages that use real APIs",
                "HTML, CSS and JavaScript basics",
                "React components, hooks, routing, API integration",
                new String[][]{
                        {"React Basics", "1", "1", "Components and Props",
                                "Compose interfaces from small, reusable components.",
                                "React components are functions that return JSX. Props pass data down; children compose layout. Components must be pure: the same props should produce the same output.\n\nUse keys for list items and keep components focused on one responsibility.",
                                "function Badge({ children, tone = 'violet' }) {\n  return <span className={`badge badge-${tone}`}>{children}</span>;\n}\n\nfunction CourseCard({ title, level }) {\n  return (\n    <article className=\"card\">\n      <h3>{title}</h3>\n      <Badge>{level}</Badge>\n    </article>\n  );\n}",
                                "A course card with a level badge",
                                "Build a reusable StatCard component with a label, value and optional trend.",
                                "[{\"question\":\"Props are...\",\"options\":[\"Mutable local state\",\"Inputs passed to a component\",\"Global variables\",\"CSS classes\"],\"answer\":1},{\"question\":\"Why are keys required in lists?\",\"options\":[\"For styling\",\"To help React identify items\",\"For sorting\",\"For accessibility\"],\"answer\":1}]",
                                "Build pure, composable components",
                                "Mutating props, using array index as a key for reorderable lists",
                                "A reusable stat card component."},
                        {"React Basics", "1", "2", "State and Events",
                                "Handle user input and re-render from state.",
                                "useState returns the current value and a setter. Setting state schedules a re-render. Never mutate state directly: create new arrays/objects.\n\nEvent handlers receive synthetic events. Controlled inputs store their value in state, which makes validation and submission predictable.",
                                "function Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <button onClick={() => setCount(c => c + 1)}>\n      Clicked {count} times\n    </button>\n  );\n}",
                                "The button increments on every click",
                                "Build a controlled search input that filters a list as the user types.",
                                "[{\"question\":\"Which hook stores local state?\",\"options\":[\"useEffect\",\"useState\",\"useMemo\",\"useRef\"],\"answer\":1},{\"question\":\"How should arrays be updated?\",\"options\":[\"push\",\"splice\",\"Create a new array\",\"Mutate state\"],\"answer\":2}]",
                                "Manage state immutably",
                                "Mutating state, stale state in rapid updates",
                                "A controlled filter input."},
                        {"React Basics", "1", "3", "Effects and Data Loading",
                                "Synchronise with external systems safely.",
                                "useEffect runs after render. The dependency array controls when it re-runs. Return a cleanup function for subscriptions and in-flight requests.\n\nHandle loading, error and empty states explicitly. Avoid setting state after unmount by using an AbortController.",
                                "useEffect(() => {\n  const controller = new AbortController();\n  setLoading(true);\n  fetch('/api/courses', { signal: controller.signal })\n    .then(r => r.ok ? r.json() : Promise.reject(r))\n    .then(setCourses)\n    .catch(e => { if (e.name !== 'AbortError') setError('Unable to load courses'); })\n    .finally(() => setLoading(false));\n  return () => controller.abort();\n}, []);",
                                "Loads courses once and renders loading/error states",
                                "Build a page that fetches data and shows skeleton, error and empty states.",
                                "[{\"question\":\"What does an empty dependency array mean?\",\"options\":[\"Run on every render\",\"Run once after mount\",\"Never run\",\"Run before render\"],\"answer\":1},{\"question\":\"What should an effect return?\",\"options\":[\"JSX\",\"A cleanup function\",\"A promise\",\"A number\"],\"answer\":1}]",
                                "Fetch data with loading and error states",
                                "Missing dependencies, ignoring cleanup",
                                "A data-loading page with three UI states."},
                        {"Hooks and Architecture", "2", "1", "Custom Hooks and Composition",
                                "Extract reusable stateful logic.",
                                "A custom hook is a function starting with use that calls other hooks. It shares logic, not state. Composition keeps components small and testable.\n\nPrefer custom hooks over inheritance or global state for local concerns.",
                                "function useToggle(initial = false) {\n  const [on, setOn] = useState(initial);\n  return [on, () => setOn(v => !v)];\n}\n\nfunction Panel() {\n  const [open, toggle] = useToggle(true);\n  return <button onClick={toggle}>{open ? 'Hide' : 'Show'}</button>;\n}",
                                "A toggle hook shared by any component",
                                "Create a useFetch(url) hook returning data, loading and error.",
                                "[{\"question\":\"A custom hook must start with...\",\"options\":[\"get\",\"use\",\"hook\",\"with\"],\"answer\":1},{\"question\":\"Custom hooks share...\",\"options\":[\"State\",\"Logic\",\"DOM nodes\",\"CSS\"],\"answer\":1}]",
                                "Extract reusable hook logic",
                                "Sharing a single state instance accidentally",
                                "A reusable data-fetching hook."},
                        {"Hooks and Architecture", "2", "2", "Routing and Protected Pages",
                                "Navigate between pages and guard private routes.",
                                "React Router maps URLs to components. useNavigate changes location; useParams reads dynamic segments. Protected routes check authentication before rendering.\n\nKeep auth state in context so guards and layouts agree on the current user.",
                                "function ProtectedRoute({ children }) {\n  const { token } = useAuth();\n  const location = useLocation();\n  if (!token) return <Navigate to=\"/login\" state={{ from: location }} replace />;\n  return children;\n}",
                                "Unauthenticated users are redirected to login",
                                "Add a route for /courses/:slug that reads the slug and renders a detail page.",
                                "[{\"question\":\"Which hook reads URL parameters?\",\"options\":[\"useState\",\"useParams\",\"useEffect\",\"useRef\"],\"answer\":1},{\"question\":\"Which component redirects declaratively?\",\"options\":[\"<Link>\",\"<Navigate>\",\"<Route>\",\"<Outlet>\"],\"answer\":1}]",
                                "Protect routes and read URL state",
                                "Checking auth only in the UI while the API is unprotected",
                                "A guarded detail route."},
                        {"Hooks and Architecture", "2", "3", "Forms and Validation",
                                "Collect, validate and submit user input.",
                                "Use controlled fields and a single state object for forms. Validate on submit and show field-level errors. Disable submit while a request is in flight to prevent duplicates.\n\nNever trust client validation: the backend must validate again.",
                                "function LoginForm({ onSubmit }) {\n  const [form, setForm] = useState({ email: '', password: '' });\n  const [errors, setErrors] = useState({});\n  function submit(e) {\n    e.preventDefault();\n    const next = {};\n    if (!form.email.includes('@')) next.email = 'Enter a valid email';\n    if (form.password.length < 8) next.password = 'At least 8 characters';\n    setErrors(next);\n    if (Object.keys(next).length === 0) onSubmit(form);\n  }\n  return <form onSubmit={submit}>...</form>;\n}",
                                "Validation errors appear before submit",
                                "Build a registration form with field validation and server error display.",
                                "[{\"question\":\"Controlled inputs store value in...\",\"options\":[\"The DOM only\",\"React state\",\"localStorage\",\"Cookies\"],\"answer\":1},{\"question\":\"Client validation is...\",\"options\":[\"Enough on its own\",\"A UX aid; the server must validate\",\"Optional and unnecessary\",\"Only for passwords\"],\"answer\":1}]",
                                "Validate forms and handle submission states",
                                "Trusting client validation, allowing double submits",
                                "A validated registration form."},
                        {"Integration", "3", "1", "API Integration Patterns",
                                "Build a small API client with consistent errors.",
                                "Centralise HTTP configuration in one client. Attach tokens in an interceptor, normalise errors and expose typed-ish helper functions per resource.\n\nHandle 401 globally, show retry for transient failures and avoid caching sensitive responses.",
                                "const api = axios.create({ baseURL: '/api' });\napi.interceptors.request.use(config => {\n  const token = localStorage.getItem('token');\n  if (token) config.headers.Authorization = `Bearer ${token}`;\n  return config;\n});\n\nexport const getCourses = () => api.get('/courses');",
                                "All requests share base URL and auth header",
                                "Create an API module for roadmap enroll and topic completion calls.",
                                "[{\"question\":\"Where should the auth header be attached?\",\"options\":[\"Every component\",\"A shared interceptor\",\"CSS\",\"The router\"],\"answer\":1},{\"question\":\"A 401 usually means...\",\"options\":[\"Not found\",\"Not authenticated\",\"Server error\",\"Bad input\"],\"answer\":1}]",
                                "Centralise API access and errors",
                                "Scattering fetch calls, exposing tokens in logs",
                                "A shared API client module."},
                        {"Integration", "3", "2", "Testing React Pages",
                                "Verify behaviour the user can see.",
                                "Test rendered output and user interactions, not implementation details. Mock the API module, render the page, assert loading then content, and simulate clicks.\n\nUse accessible queries (role, label) so tests also validate accessibility.",
                                "test('shows courses after loading', async () => {\n  vi.spyOn(api, 'getCourses').mockResolvedValue({ data: [{ slug: 'java', title: 'Java' }] });\n  render(<Courses />);\n  expect(screen.getByText(/loading/i)).toBeInTheDocument();\n  expect(await screen.findByText('Java')).toBeInTheDocument();\n});",
                                "The test waits for real async rendering",
                                "Write a test for an empty state and an error state.",
                                "[{\"question\":\"Which query is preferred?\",\"options\":[\"getByTestId\",\"getByRole\",\"querySelector\",\"getByClass\"],\"answer\":1},{\"question\":\"findBy queries are...\",\"options\":[\"Synchronous\",\"Asynchronous\",\"Only for inputs\",\"Deprecated\"],\"answer\":1}]",
                                "Test user-visible behaviour",
                                "Asserting internal state instead of UI",
                                "Tests for loading, empty and error states."}
                });

        course("spring-boot-backend", "Spring Boot Backend",
                "Build secure REST APIs with Spring Boot, JPA and tests.",
                "A practical backend course: dependency injection, REST design, validation, persistence, "
                        + "security and testing. Every lesson maps to code you can apply in this project.",
                "Backend", "Intermediate", "Intermediate", 420,
                "Spring, Spring Boot, REST, JPA, validation, security, testing",
                "Design and implement production-shaped REST APIs",
                "Java and basic SQL",
                "Spring Boot, REST APIs, JPA, security, testing",
                new String[][]{
                        {"Spring Core", "1", "1", "Dependency Injection and Beans",
                                "Let the container wire your objects.",
                                "Spring creates and manages beans. Constructor injection makes dependencies explicit and supports immutability. @Component, @Service and @Repository are stereotypes discovered by component scanning.\n\nAvoid field injection. Keep configuration in @Configuration classes and use profiles for environment differences.",
                                "@Service\npublic class CourseService {\n    private final CourseRepository repository;\n\n    public CourseService(CourseRepository repository) {\n        this.repository = repository;\n    }\n}",
                                "CourseService receives its repository from Spring",
                                "Explain the difference between @Component, @Service and @Repository.",
                                "[{\"question\":\"Which injection style is preferred?\",\"options\":[\"Field\",\"Constructor\",\"Setter only\",\"Static\"],\"answer\":1},{\"question\":\"What does the Spring container manage?\",\"options\":[\"Only controllers\",\"Beans and their dependencies\",\"The database\",\"The browser\"],\"answer\":1}]",
                                "Use constructor injection and clear bean boundaries",
                                "Field injection, hidden dependencies",
                                "A service wired by constructor injection."},
                        {"Spring Core", "1", "2", "Configuration and Profiles",
                                "Configure the application per environment.",
                                "Spring Boot reads application.properties/YAML and environment variables. Profiles activate environment-specific configuration. @ConfigurationProperties binds groups of settings with validation.\n\nNever commit secrets. Use environment variables and keep safe defaults for local development.",
                                "app:\n  frontend:\n    base-url: ${FRONTEND_BASE_URL:http://localhost:5173}\n\n@ConfigurationProperties(prefix = \"app.frontend\")\npublic record FrontendProperties(String baseUrl) {}",
                                "The base URL is configurable without code changes",
                                "Move a hardcoded URL into configuration with a safe default.",
                                "[{\"question\":\"Where should secrets live?\",\"options\":[\"In git\",\"Environment variables\",\"Frontend JS\",\"README\"],\"answer\":1},{\"question\":\"Profiles are used for...\",\"options\":[\"Styling\",\"Environment-specific configuration\",\"Database rows\",\"Tests only\"],\"answer\":1}]",
                                "Externalise configuration safely",
                                "Hardcoded credentials, committing secrets",
                                "A validated configuration properties class."},
                        {"REST APIs", "2", "1", "REST Controllers and DTOs",
                                "Expose resources without leaking entities.",
                                "Controllers map HTTP requests to service calls. Use @RestController, @RequestMapping and typed request/response DTOs. Return ResponseEntity for explicit status codes.\n\nKeep controllers thin: validation and orchestration belong in services. Paginate collections that can grow.",
                                "@GetMapping\npublic ResponseEntity<Page<CourseSummary>> list(\n        @RequestParam(defaultValue = \"0\") int page,\n        @RequestParam(defaultValue = \"20\") int size) {\n    return ResponseEntity.ok(service.list(page, Math.min(size, 50)));\n}",
                                "A paginated list endpoint capped at 50 items",
                                "Add a GET /api/courses/{slug} endpoint that returns 404 semantics for unknown slugs.",
                                "[{\"question\":\"DTOs protect...\",\"options\":[\"The database\",\"API contracts and internal entities\",\"CSS\",\"Logs\"],\"answer\":1},{\"question\":\"Why cap page size?\",\"options\":[\"Faster typing\",\"Avoid unbounded queries\",\"Better colors\",\"Required by HTTP\"],\"answer\":1}]",
                                "Design thin controllers with DTOs",
                                "Returning entities with lazy fields, unbounded lists",
                                "A validated, paginated controller."},
                        {"REST APIs", "2", "2", "Validation and Error Handling",
                                "Reject bad input consistently.",
                                "Bean Validation annotations (@NotBlank, @Size, @Min, @Email) validate request DTOs when @Valid is used. A @RestControllerAdvice maps exceptions to consistent error responses.\n\nUse 400 for invalid input, 401 unauthenticated, 403 forbidden, 404 missing and 409 conflicts.",
                                "@PostMapping\npublic ResponseEntity<Course> create(@Valid @RequestBody CreateCourse request) {\n    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));\n}\n\n@ExceptionHandler(IllegalArgumentException.class)\nResponseEntity<ApiError> badRequest(IllegalArgumentException ex) {\n    return ResponseEntity.badRequest().body(new ApiError(ex.getMessage()));\n}",
                                "Invalid payloads return 400 with a message",
                                "Add validation to a request and a test for the failure case.",
                                "[{\"question\":\"Which annotation triggers DTO validation?\",\"options\":[\"@Valid\",\"@NotNull only\",\"@Entity\",\"@Transactional\"],\"answer\":0},{\"question\":\"Which status means forbidden?\",\"options\":[\"400\",\"401\",\"403\",\"404\"],\"answer\":2}]",
                                "Validate input and map errors to status codes",
                                "Returning 500 for user mistakes",
                                "A validation test for a bad request."},
                        {"Persistence", "3", "1", "JPA Entities and Relationships",
                                "Map relational data without surprises.",
                                "Entities map tables; @Id defines the key; @ManyToOne and @OneToMany define relationships. Prefer LAZY fetching and explicit queries.\n\nAvoid exposing entities directly. Use unique constraints and indexes to enforce integrity and support query patterns.",
                                "@Entity\n@Table(name = \"enrollments\",\n       uniqueConstraints = @UniqueConstraint(columnNames = {\"user_id\", \"roadmap_id\"}))\npublic class Enrollment {\n    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)\n    private Long id;\n    @ManyToOne(optional = false) private User user;\n    @ManyToOne(optional = false) private Roadmap roadmap;\n}",
                                "The database prevents duplicate enrollments",
                                "Model a one-to-many relationship with a unique constraint.",
                                "[{\"question\":\"Which fetch type is safer by default?\",\"options\":[\"EAGER\",\"LAZY\",\"NONE\",\"CASCADE\"],\"answer\":1},{\"question\":\"A unique constraint prevents...\",\"options\":[\"Nulls\",\"Duplicate rows\",\"Indexes\",\"Joins\"],\"answer\":1}]",
                                "Map relationships and constraints",
                                "EAGER everywhere, missing indexes",
                                "A mapped entity with a unique constraint."},
                        {"Persistence", "3", "2", "Transactions and Query Performance",
                                "Keep operations atomic and queries bounded.",
                                "Use @Transactional on service methods that change multiple rows. Read-only transactions document intent. Avoid the N+1 problem by fetching related data in one query.\n\nAlways paginate history and catalog queries. Add indexes for filters and sort columns.",
                                "@Transactional\npublic void completeTopic(Long enrollmentId, Long topicId) {\n    Enrollment enrollment = enrollments.findById(enrollmentId).orElseThrow();\n    Progress progress = progressRepository\n            .findByEnrollmentAndTopic(enrollment, topicId)\n            .orElseGet(() -> Progress.start(enrollment, topicId));\n    progress.markComplete();\n}",
                                "Progress update is atomic",
                                "Identify an N+1 query in a service and fix it with a fetch join.",
                                "[{\"question\":\"What does @Transactional guarantee?\",\"options\":[\"Faster queries\",\"Atomic commit or rollback\",\"Caching\",\"JSON parsing\"],\"answer\":1},{\"question\":\"N+1 queries cause...\",\"options\":[\"Fewer queries\",\"Many small queries\",\"Better indexes\",\"No effect\"],\"answer\":1}]",
                                "Use transactions and bounded queries",
                                "Missing transaction boundaries, unbounded findAll",
                                "A transactional service method with a test."},
                        {"Security and Testing", "4", "1", "Authentication and Ownership",
                                "Derive identity from the request, never the payload.",
                                "Spring Security authenticates the request and exposes the principal. Services must load the user from the principal and verify ownership of every resource.\n\nNever accept a userId from the client for authorization. Check roles and ownership on the server for every read and write.",
                                "@GetMapping(\"/api/roadmaps/my\")\npublic ResponseEntity<?> my(Authentication auth) {\n    return ResponseEntity.ok(service.my(auth.getName()));\n}\n\n// service: findByUserAndRoadmap(currentUser(), roadmap)",
                                "The endpoint ignores any client-supplied user id",
                                "Explain how you would prevent one student reading another student's interview session.",
                                "[{\"question\":\"Where should identity come from?\",\"options\":[\"Request body\",\"Query parameter\",\"Authenticated principal\",\"localStorage\"],\"answer\":2},{\"question\":\"Ownership checks belong...\",\"options\":[\"Only in React\",\"On the backend\",\"In CSS\",\"In the README\"],\"answer\":1}]",
                                "Enforce identity and ownership server-side",
                                "Trusting client ids, checking ownership only in the UI",
                                "An ownership test for a protected resource."},
                        {"Security and Testing", "4", "2", "Testing Spring Boot APIs",
                                "Test the contract and the security rules.",
                                "Use JUnit 5 with MockMvc for controller tests and @SpringBootTest for integration flows. Mock external services. Test success, validation failure, unauthorized access and ownership violations.\n\nKeep tests deterministic and independent. Run the full regression suite before shipping.",
                                "@Test\nvoid rejectsAnonymousAccess() throws Exception {\n    mockMvc.perform(get(\"/api/roadmaps/my\"))\n           .andExpect(status().isUnauthorized());\n}\n\n@Test\nvoid enrollsStudent() throws Exception {\n    mockMvc.perform(post(\"/api/roadmaps/java-full-stack/enroll\")\n            .with(user(\"ada\")))\n           .andExpect(status().isOk());\n}",
                                "Security and enrolment are covered by tests",
                                "Add a test that verifies one student cannot read another student's session.",
                                "[{\"question\":\"Which tool tests MVC endpoints?\",\"options\":[\"MockMvc\",\"JUnit only\",\"Selenium\",\"Postman\"],\"answer\":0},{\"question\":\"Which case must be tested?\",\"options\":[\"Only success\",\"Success and failures\",\"Only UI\",\"None\"],\"answer\":1}]",
                                "Test API contracts and security",
                                "Testing only the happy path",
                                "A controller test covering success and denial."}
                });

        course("fullstack-projects", "Full Stack Projects",
                "Plan, build, test and ship a complete React and Spring Boot application.",
                "A project-based course that takes you from a written brief to a deployed full-stack app. "
                        + "You will design a schema, define a REST contract, connect React to Spring Boot, "
                        + "add authentication, write tests and deploy with environment-based configuration.",
                "Full Stack", "Intermediate", "Intermediate", 600,
                "Scope a project, design a schema and API, integrate React with Spring Boot, authenticate users, test and deploy",
                "Build and ship a portfolio-ready full-stack application",
                "Java Foundations, Spring Boot Backend and React Frontend",
                "Project planning, database design, REST contracts, React integration, authentication, testing, deployment",
                new String[][]{
                        {"Project Foundations", "1", "1", "Scoping a Portfolio Project",
                                "Turn an idea into a small, demonstrable MVP with clear user stories.",
                                "A portfolio project should prove a skill, not model an entire business. Write the problem in one sentence, list three to five user stories and define what the demo must show. Choose a vertical slice: one feature that touches the database, the API and the UI.\n\nWrite acceptance criteria for each story and keep an out-of-scope list. A finished small project is stronger than an unfinished large one.",
                                "record UserStory(String role, String action, String value) {}\n\nUserStory story = new UserStory(\n        \"student\", \"create a board\", \"organise coursework\");\nSystem.out.println(story.role() + \" can \" + story.action()\n        + \" to \" + story.value());",
                                "student can create a board to organise coursework",
                                "Write five user stories for your project, mark the demo-critical vertical slice and list two things that are out of scope.",
                                "[{\"question\":\"What is the best first milestone for a portfolio project?\",\"options\":[\"Every planned feature\",\"One vertical slice that works end to end\",\"Only the database\",\"Only the landing page\"],\"answer\":1},{\"question\":\"Why keep an out-of-scope list?\",\"options\":[\"To look busy\",\"To protect a finishable scope\",\"To avoid tests\",\"To skip documentation\"],\"answer\":1}]",
                                "Write testable user stories and a finishable MVP scope",
                                "Starting with infrastructure, scope that cannot be demoed",
                                "A one-page brief with user stories, acceptance criteria and out-of-scope items."},
                        {"Project Foundations", "1", "2", "Designing the Database Schema",
                                "Model ownership and relationships before writing API code.",
                                "Start from the questions the UI must answer. Each table needs a primary key, foreign keys for relationships and constraints that encode invariants. A board belongs to one owner; a task belongs to one board. Add indexes for columns used in filters and joins.\n\nUse unique constraints to prevent duplicates and decide cascade behaviour deliberately. In development JPA can update the schema, but production changes should be reviewed migrations.",
                                "CREATE TABLE boards (\n  id BIGINT PRIMARY KEY AUTO_INCREMENT,\n  owner_id BIGINT NOT NULL,\n  title VARCHAR(120) NOT NULL,\n  CONSTRAINT fk_board_owner FOREIGN KEY (owner_id) REFERENCES users(id)\n);\n\nCREATE TABLE tasks (\n  id BIGINT PRIMARY KEY AUTO_INCREMENT,\n  board_id BIGINT NOT NULL,\n  title VARCHAR(200) NOT NULL,\n  completed BOOLEAN NOT NULL DEFAULT FALSE,\n  CONSTRAINT fk_task_board FOREIGN KEY (board_id) REFERENCES boards(id)\n);\n\nCREATE INDEX idx_task_board ON tasks(board_id);",
                                "Tables boards and tasks are created with foreign keys and an index on board_id",
                                "Model users, boards and tasks with ownership. Explain each foreign key and choose a cascade rule.",
                                "[{\"question\":\"What does a foreign key enforce?\",\"options\":[\"A unique page title\",\"Referential integrity\",\"Faster CSS\",\"JSON formatting\"],\"answer\":1},{\"question\":\"Why index tasks(board_id)?\",\"options\":[\"To sort users\",\"To speed board task lookups\",\"To hide rows\",\"To avoid transactions\"],\"answer\":1}]",
                                "Design normalized tables with constraints and indexes",
                                "Storing comma-separated ids, missing foreign keys, unbounded text columns",
                                "A schema diagram with keys, constraints and indexes."},
                        {"Project Foundations", "1", "3", "Designing the REST Contract",
                                "Agree on resources, status codes and payloads before implementation.",
                                "A REST contract names resources, not actions. Use GET to read, POST to create, PUT or PATCH to update and DELETE to remove. Return 201 with a Location header after creation, 204 after deletion and 400/401/403/404 for failures.\n\nReturn DTOs, not entities. Paginate collections and keep error responses consistent so the React client can handle them once.",
                                "POST /api/boards\nContent-Type: application/json\n\n{\"title\":\"Semester plan\"}\n\n201 Created\n{\"id\":12,\"title\":\"Semester plan\",\"owner\":\"ada\",\"createdAt\":\"2026-01-10T09:00:00\"}",
                                "201 Created with the persisted board and no internal entity fields",
                                "Write the endpoints and status codes for listing, creating and completing tasks. Include one validation error response.",
                                "[{\"question\":\"Which status code should a successful create return?\",\"options\":[\"200\",\"201\",\"204\",\"302\"],\"answer\":1},{\"question\":\"Why return DTOs?\",\"options\":[\"To expose lazy fields\",\"To control the API contract\",\"To skip validation\",\"To avoid HTTP\"],\"answer\":1}]",
                                "Define resource-oriented endpoints with consistent responses",
                                "Verb-based URLs, returning entities, ad-hoc error shapes",
                                "An API contract table with methods, paths and status codes."},
                        {"Integration", "2", "1", "Connecting React to Spring Boot",
                                "Replace mock data with a typed API module and real loading states.",
                                "Keep HTTP calls in one API module. Read the base URL from an environment variable so the same build works locally and in production. Every screen needs loading, empty and error states, and mutations should refresh the affected data.\n\nIn development, proxy /api to Spring Boot to avoid CORS surprises. In production, serve both behind one origin or configure CORS explicitly.",
                                "const api = axios.create({\n  baseURL: import.meta.env.VITE_API_URL || \"/api\",\n});\n\nexport async function getBoards() {\n  const response = await api.get(\"/boards\");\n  return response.data;\n}\n\nexport async function createBoard(title) {\n  const response = await api.post(\"/boards\", { title });\n  return response.data;\n}",
                                "The UI reads and writes boards through one API module",
                                "Add loading, empty and error states to the board list, then refetch after creating a board.",
                                "[{\"question\":\"Where should the API base URL come from?\",\"options\":[\"Hardcoded in every component\",\"Environment configuration\",\"A CSS variable\",\"The database\"],\"answer\":1},{\"question\":\"What should happen after a successful mutation?\",\"options\":[\"Nothing\",\"Refresh the affected data\",\"Reload the browser\",\"Clear the database\"],\"answer\":1}]",
                                "Centralise HTTP calls and handle async UI states",
                                "Fetching in every component, ignoring errors, stale lists after mutations",
                                "A working API module with loading and error states."},
                        {"Integration", "2", "2", "Authentication and Protected Routes",
                                "Carry the authenticated identity without trusting client-side ids.",
                                "Login returns a token that the client sends in the Authorization header. The backend validates the token, loads the user and scopes every query to that user. The frontend can hide routes for convenience, but it is never the security boundary.\n\nStore tokens carefully, clear them on logout and handle 401 responses by returning to login. Never send a userId from the client to decide ownership.",
                                "function ProtectedRoute({ children }) {\n  const token = localStorage.getItem(\"token\");\n  return token ? children : <Navigate to=\"/login\" replace />;\n}\n\n// axios interceptor\napi.interceptors.request.use((config) => {\n  const token = localStorage.getItem(\"token\");\n  if (token) config.headers.Authorization = `Bearer ${token}`;\n  return config;\n});",
                                "Unauthenticated users are redirected and API calls carry the token",
                                "Protect the board routes and verify the backend rejects requests without a token.",
                                "[{\"question\":\"Where is ownership enforced?\",\"options\":[\"React route guards\",\"Backend using the authenticated principal\",\"localStorage\",\"CSS\"],\"answer\":1},{\"question\":\"What should the client do on a 401 response?\",\"options\":[\"Ignore it\",\"Clear the session and return to login\",\"Retry forever\",\"Show a success message\"],\"answer\":1}]",
                                "Wire authentication end to end and enforce ownership server-side",
                                "Trusting a client-supplied user id, storing secrets in the frontend",
                                "A protected route plus an ownership test."},
                        {"Shipping", "3", "1", "Testing the Full Stack",
                                "Cover the contract, the UI flow and the security rules.",
                                "Backend tests should cover success, validation failures and ownership violations. MockMvc exercises controllers without a running server; @SpringBootTest covers wiring. On the frontend, test user-visible behaviour with React Testing Library instead of implementation details.\n\nKeep tests deterministic: create their own data, avoid shared state and mock network modules at the boundary.",
                                "@Test\nvoid rejectsAnotherStudentsBoard() throws Exception {\n    mockMvc.perform(get(\"/api/boards/99\").with(user(\"mallory\")))\n           .andExpect(status().isNotFound());\n}\n\n@Test\nvoid listsOwnBoards() throws Exception {\n    mockMvc.perform(get(\"/api/boards\").with(user(\"ada\")))\n           .andExpect(status().isOk());\n}",
                                "Ownership violations are covered by an automated test",
                                "Write one controller test for success and one for cross-student access, then add a React test for the empty state.",
                                "[{\"question\":\"Which tool tests MVC endpoints without a server?\",\"options\":[\"MockMvc\",\"Selenium\",\"Postman only\",\"CSS\"],\"answer\":0},{\"question\":\"Which case is essential for ownership?\",\"options\":[\"Only the happy path\",\"Cross-student access denial\",\"Only styling\",\"None\"],\"answer\":1}]",
                                "Test API contracts, UI behaviour and ownership rules",
                                "Testing only the happy path, sharing state between tests",
                                "A small but meaningful full-stack test suite."},
                        {"Shipping", "3", "2", "Deployment and Environment Configuration",
                                "Ship the same artifact with environment-specific configuration.",
                                "Build the React app, package the Spring Boot jar and run both behind one domain. Keep database URLs, credentials and API keys in environment variables. Use profiles for environment differences and expose a health endpoint for the platform.\n\nBefore deploying, run the full test suite, check the production build and verify that no secret is committed. After deploying, smoke-test login, one read and one write.",
                                "spring.datasource.url=${DB_URL}\nspring.datasource.username=${DB_USERNAME}\nspring.datasource.password=${DB_PASSWORD}\n\n# build\nnpm run build\nmvn -o clean package",
                                "The same artifact runs locally and in production with different environment values",
                                "List every environment variable the app needs, remove secrets from the repository and document the deploy steps.",
                                "[{\"question\":\"Where should production secrets live?\",\"options\":[\"In git\",\"In environment variables\",\"In React code\",\"In the README\"],\"answer\":1},{\"question\":\"What should be smoke-tested after deployment?\",\"options\":[\"Only the home page\",\"Login plus one read and one write\",\"Only CSS\",\"Nothing\"],\"answer\":1}]",
                                "Deploy with safe configuration and verify the running app",
                                "Committing secrets, skipping the production build, deploying without a smoke test",
                                "A deployment checklist and a verified production URL."}
                });

        course("job-preparation", "Job Preparation",
                "Turn your projects and practice into clear, confident interview answers.",
                "A practical interview-preparation course covering project explanation, DSA revision, "
                        + "Java, Spring and SQL drills, system design basics and behavioural rounds. "
                        + "Every lesson includes a structure you can rehearse and a checklist for feedback.",
                "Career", "Intermediate", "Intermediate", 360,
                "Explain projects, revise DSA patterns, answer Java/Spring/SQL questions and handle behavioural rounds",
                "Prepare for technical and behavioural interviews",
                "Java Foundations, DSA Essentials and SQL Mastery",
                "Interview structure, DSA revision, technical drills, system design, behavioural answers",
                new String[][]{
                        {"Interview Strategy", "1", "1", "Explaining Your Projects with STAR",
                                "Turn project work into a concise, credible story.",
                                "Interviewers want to know what you built, why it mattered and what you owned. Use STAR: Situation, Task, Action, Result. Keep the architecture explanation to 60 seconds, name the trade-offs you considered and finish with a measurable result or lesson.\n\nRehearse the same story at 30 seconds, 90 seconds and three minutes so you can adapt to the interviewer.",
                                "String[] star = {\n    \"Situation: students tracked coursework in spreadsheets\",\n    \"Task: build a web app with accounts and progress\",\n    \"Action: designed the REST API, React UI and MySQL schema\",\n    \"Result: 40 beta users, 70% completed their first course\"\n};\nfor (String line : star) System.out.println(line);",
                                "Four STAR lines that describe the project and its result",
                                "Write a 90-second STAR answer for your strongest project and record it. Remove any detail you cannot defend.",
                                "[{\"question\":\"What does the R in STAR stand for?\",\"options\":[\"Requirement\",\"Result\",\"Refactor\",\"Review\"],\"answer\":1},{\"question\":\"What should you do when asked about a trade-off?\",\"options\":[\"Change the subject\",\"Explain the alternatives and why you chose one\",\"Say there were none\",\"Blame a teammate\"],\"answer\":1}]",
                                "Present projects with structure, ownership and measurable outcomes",
                                "Reciting every file, claiming team work you did not do, hiding trade-offs",
                                "A rehearsed 90-second project story."},
                        {"Interview Strategy", "1", "2", "A DSA Revision Plan That Sticks",
                                "Revise by pattern and revisit failures instead of grinding random problems.",
                                "Group problems by pattern: arrays and hashing, two pointers, sliding window, stacks, linked lists, trees, graphs and dynamic programming. Schedule short, focused sessions and leave time to re-solve problems you failed.\n\nUse spaced repetition: revisit a pattern after one day, one week and one month. Track time to solve and mistakes, not just the number of problems.",
                                "Map<String, Integer> plan = new LinkedHashMap<>();\nplan.put(\"arrays and hashing\", 6);\nplan.put(\"trees and graphs\", 4);\nplan.put(\"dynamic programming\", 3);\nplan.forEach((topic, sessions) ->\n        System.out.println(topic + \": \" + sessions + \" sessions\"));",
                                "arrays and hashing: 6 sessions\ntrees and graphs: 4 sessions\ndynamic programming: 3 sessions",
                                "Build a two-week plan with at least two revision passes and one timed mock interview.",
                                "[{\"question\":\"Why revisit failed problems?\",\"options\":[\"To memorise answers\",\"To fix the underlying pattern gap\",\"To inflate counts\",\"To avoid new topics\"],\"answer\":1},{\"question\":\"What is spaced repetition?\",\"options\":[\"Cramming once\",\"Reviewing at increasing intervals\",\"Only reading solutions\",\"Skipping practice\"],\"answer\":1}]",
                                "Plan revision by pattern and review failures deliberately",
                                "Random problem grinding, counting problems without understanding",
                                "A two-week revision calendar with review checkpoints."},
                        {"Interview Strategy", "1", "3", "Complexity and Trade-off Questions",
                                "Answer with assumptions, complexity and an explicit trade-off.",
                                "State the input size and assumptions first. Give time and space complexity, then compare one alternative. For example, sorting once costs O(n log n) time and little extra space, while a hash set gives O(n) time and O(n) space.\n\nInterviewers care more about reasoning than memorised Big-O. Mention edge cases and what you would change at a larger scale.",
                                "int[] values = {4, 7, 1, 9, 2};\nArrays.sort(values);\n\nSet<Integer> seen = new HashSet<>();\nfor (int value : values) seen.add(value);\n\nSystem.out.println(Arrays.toString(values) + \" \" + seen.contains(7));",
                                "[1, 2, 4, 7, 9] true",
                                "For three problems you solved, state the complexity and one alternative with its trade-off.",
                                "[{\"question\":\"What should you state before complexity?\",\"options\":[\"Your favourite IDE\",\"Input size and assumptions\",\"The font\",\"Your grade\"],\"answer\":1},{\"question\":\"Which is a real trade-off?\",\"options\":[\"Hash set O(n) time and O(n) space\",\"Sorting is always free\",\"Memory never matters\",\"Big-O is optional\"],\"answer\":0}]",
                                "Explain complexity with assumptions and alternatives",
                                "Giving Big-O without context, ignoring space, memorising without reasoning",
                                "A short trade-off write-up for three problems."},
                        {"Technical Rounds", "2", "1", "Java and Spring Interview Drills",
                                "Answer common questions with a definition, an example and a trade-off.",
                                "Expect questions on == versus equals, immutability, HashMap behaviour, exceptions, dependency injection, @Transactional, JPA relationships and REST status codes. Answer in three beats: define the concept, give a concrete example, then name a trade-off or pitfall.\n\nFor Spring, explain constructor injection, bean scopes and why ownership checks belong in the service layer.",
                                "@Service\npublic class EnrollmentService {\n    private final EnrollmentRepository repository;\n\n    public EnrollmentService(EnrollmentRepository repository) {\n        this.repository = repository;\n    }\n\n    public Enrollment enroll(User user, Course course) {\n        return repository.findByUserAndCourse(user, course)\n                .orElseGet(() -> repository.save(\n                        Enrollment.start(user, course)));\n    }\n}",
                                "Dependencies are explicit and the service is easy to test",
                                "Answer five Java and five Spring questions out loud using definition, example and trade-off.",
                                "[{\"question\":\"Why prefer constructor injection?\",\"options\":[\"It hides dependencies\",\"It makes dependencies explicit and testable\",\"It is faster at runtime\",\"It avoids classes\"],\"answer\":1},{\"question\":\"What does @Transactional roll back on?\",\"options\":[\"Checked exceptions only\",\"Runtime exceptions by default\",\"All exceptions always\",\"Nothing\"],\"answer\":1}]",
                                "Explain Java and Spring concepts with examples and pitfalls",
                                "Reciting definitions without examples, confusing equals and ==",
                                "Ten rehearsed technical answers."},
                        {"Technical Rounds", "2", "2", "SQL Interview Drills",
                                "Read queries precisely and explain the result set.",
                                "Interview SQL usually tests joins, aggregation, subqueries, CTEs and window functions. Read the question twice, identify the grain of the result, then choose the join and grouping. Remember that WHERE filters rows before grouping and HAVING filters groups.\n\nExplain NULL semantics and why LEFT JOIN plus a WHERE condition can silently become an inner join.",
                                "SELECT b.title, COUNT(t.id) AS open_tasks\nFROM boards b\nLEFT JOIN tasks t\n       ON t.board_id = b.id AND t.completed = FALSE\nGROUP BY b.id, b.title\nHAVING COUNT(t.id) > 0\nORDER BY open_tasks DESC;",
                                "One row per board with at least one open task, ordered by workload",
                                "Write a query for the second-highest score per category and explain the window function you used.",
                                "[{\"question\":\"Which clause filters groups?\",\"options\":[\"WHERE\",\"HAVING\",\"ORDER BY\",\"LIMIT\"],\"answer\":1},{\"question\":\"How do you test for NULL?\",\"options\":[\"= NULL\",\"IS NULL\",\"== NULL\",\"<> NULL\"],\"answer\":1}]",
                                "Write correct joins and aggregations and explain NULL behaviour",
                                "Using WHERE instead of HAVING, turning LEFT JOIN into INNER JOIN accidentally",
                                "A set of five queries with explanations."},
                        {"Technical Rounds", "2", "3", "System Design for Junior Developers",
                                "Clarify requirements and sketch a simple, honest design.",
                                "Start with requirements and scale: who uses the system, how often and what must be fast. Sketch the client, API, database and any cache or background worker. Explain data flow for the two most important use cases, then discuss failure modes and security.\n\nJunior interviews reward clear reasoning, not unnecessary complexity. Say what you would add only when scale demands it.",
                                "String[] components = {\n    \"React client -> REST API\",\n    \"REST API -> MySQL primary\",\n    \"REST API -> cache for read-heavy catalog\",\n    \"Background worker -> email notifications\"\n};\nfor (String component : components) System.out.println(component);",
                                "A four-component sketch with a clear data flow",
                                "Design a study tracker for 10,000 students. List components, the read and write paths and two trade-offs.",
                                "[{\"question\":\"What should come first in a design interview?\",\"options\":[\"Choosing a cloud vendor\",\"Clarifying requirements and scale\",\"Writing code\",\"Adding microservices\"],\"answer\":1},{\"question\":\"When should you add a cache?\",\"options\":[\"Always\",\"When reads dominate and staleness is acceptable\",\"Before the database\",\"Only for CSS\"],\"answer\":1}]",
                                "Reason about requirements, components and trade-offs",
                                "Jumping to microservices, ignoring scale, hand-waving failure modes",
                                "A one-page design with requirements and trade-offs."},
                        {"Behavioural Rounds", "3", "1", "Behavioural Questions and Career Goals",
                                "Answer honestly with specific situations and measurable outcomes.",
                                "Behavioural interviews test how you work with people. Prepare STAR stories for conflict, failure, a tight deadline and a time you disagreed with feedback. For weaknesses, describe a real gap and the system you use to improve it.\n\nFinish with thoughtful questions about the team, the work and how success is measured. Avoid generic answers and never invent stories you cannot discuss in detail.",
                                "record Answer(String situation, String action, String result) {}\n\nAnswer answer = new Answer(\n    \"A teammate missed a deadline\",\n    \"Split the task, paired on the risky part, added a daily check-in\",\n    \"We shipped two days late but with tests and no follow-up bugs\"\n);\nSystem.out.println(answer.result());",
                                "We shipped two days late but with tests and no follow-up bugs",
                                "Prepare STAR answers for conflict, failure and why-this-role. Rehearse each in under two minutes.",
                                "[{\"question\":\"What makes a behavioural answer credible?\",\"options\":[\"Vague claims\",\"A specific situation and result\",\"Blaming others\",\"Memorised buzzwords\"],\"answer\":1},{\"question\":\"How should you describe a weakness?\",\"options\":[\"Deny it\",\"Name it and explain how you improve\",\"Call it a strength\",\"Change the subject\"],\"answer\":1}]",
                                "Answer behavioural questions with structure and honesty",
                                "Generic answers, taking no ownership, inventing stories",
                                "Three rehearsed STAR stories plus questions for the interviewer."}
                });
    }

    private void course(String slug, String title, String shortDescription, String detailedDescription,
                        String category, String difficulty, String level, int durationMinutes,
                        String objectives, String skills, String prerequisites, String skillsGained,
                        String[][] lessons) {
        Course course = courseRepository.findBySlug(slug).orElseGet(() -> courseRepository.save(
                Course.builder()
                        .slug(slug).title(title).shortDescription(shortDescription)
                        .detailedDescription(detailedDescription).category(category).difficulty(difficulty)
                        .level(level).estimatedDurationMinutes(durationMinutes)
                        .lessonCount(lessons.length).problemCount(0)
                        .learningObjectives(objectives).prerequisites(prerequisites)
                        .skillsGained(skillsGained).build()));

        // Repair partially seeded courses without touching existing lessons or
        // course metadata. Lessons are matched by their module/lesson position.
        Set<String> existingLessons = new HashSet<>();
        for (CourseLesson lesson : lessonRepository
                .findByCourseOrderByModuleOrderAscLessonOrderAsc(course)) {
            existingLessons.add(lesson.getModuleOrder() + ":" + lesson.getLessonOrder());
        }

        for (String[] row : lessons) {
            String position = Integer.parseInt(row[1]) + ":" + Integer.parseInt(row[2]);
            if (!existingLessons.add(position)) continue;
            lessonRepository.save(CourseLesson.builder()
                    .course(course)
                    .moduleName(row[0])
                    .moduleOrder(Integer.parseInt(row[1]))
                    .lessonOrder(Integer.parseInt(row[2]))
                    .title(row[3])
                    .description(row[4])
                    .lessonContent(row[5])
                    .codeExample(row[6])
                    .expectedOutput(row[7])
                    .exercise(row[8])
                    .quiz(row[9])
                    .learningObjectives(row[10])
                    .commonMistakes(row[11])
                    .resources(resourcesFor(slug))
                    .estimatedMinutes(35)
                    .build());
        }
    }

    private String resourcesFor(String slug) {
        return switch (slug) {
            case "java-foundations" ->
                    "dev.java tutorials|https://dev.java/learn/,CodeVerse practice|/problems";
            case "dsa-essentials" ->
                    "VisuAlgo visualisations|https://visualgo.net/en,CodeVerse practice|/problems";
            case "sql-mastery" ->
                    "SQLBolt interactive lessons|https://sqlbolt.com/,CodeVerse practice|/problems";
            case "react-frontend" ->
                    "React documentation|https://react.dev/learn,MDN Web Docs|https://developer.mozilla.org/en-US/docs/Web";
            case "spring-boot-backend" ->
                    "Spring guides|https://spring.io/guides,Spring Boot reference|https://docs.spring.io/spring-boot/reference/";
            case "fullstack-projects" ->
                    "MDN Web Docs|https://developer.mozilla.org/en-US/docs/Web,Spring guides|https://spring.io/guides";
            case "job-preparation" ->
                    "CodeVerse interview arena|/interview-arena,CodeVerse practice|/problems";
            default -> "CodeVerse practice|/problems";
        };
    }
}
