package com.srhcodeverse.backend.service;

import com.srhcodeverse.backend.entity.Course;
import com.srhcodeverse.backend.entity.CourseLesson;
import com.srhcodeverse.backend.repository.CourseLessonRepository;
import com.srhcodeverse.backend.repository.CourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class LessonContentUpdater {
    private final CourseRepository courseRepository;
    private final CourseLessonRepository lessonRepository;

    public LessonContentUpdater(CourseRepository courseRepository,
                                CourseLessonRepository lessonRepository) {
        this.courseRepository = courseRepository;
        this.lessonRepository = lessonRepository;
    }

    @Transactional
    public int populateJavaLessons() {
        Course course = courseRepository.findBySlug("java-programming")
                .orElseThrow(() -> new IllegalArgumentException(
                        "Java Programming course not found"));

        List<CourseLesson> lessons =
                lessonRepository.findByCourseOrderByModuleOrderAscLessonOrderAsc(course);

        int updated = 0;

        for (CourseLesson lesson : lessons) {
            String title = lesson.getTitle() == null
                    ? "" : lesson.getTitle().toLowerCase(Locale.ROOT);

            String content;
            String code;
            String exercise;
            String quiz;

            if (title.contains("what is java") || title.contains("jvm")) {
                content = """
                        Java is a high-level, class-based programming language.
                        The Java compiler (javac) converts source code into bytecode.
                        The Java Virtual Machine (JVM) executes bytecode.
                        The JDK contains development tools; the JVM runs Java bytecode.

                        Workflow:
                        1. Save source code in Main.java.
                        2. Compile: javac Main.java
                        3. Run: java Main

                        Java is case-sensitive. Main and main are different identifiers.
                        """;
                code = """
                        public class Main {
                            public static void main(String[] args) {
                                System.out.println("Hello, Java!");
                            }
                        }
                        """;
                exercise = "Explain the JDK, JRE and JVM. Compile and run the example, then change the message.";
                quiz = "Which component executes Java bytecode? A) javac B) JVM C) Scanner D) IDE\nAnswer: B) JVM";
            } else if (title.contains("install jdk")) {
                content = """
                        Install a JDK distribution and configure your IDE.
                        Open a terminal and run java -version and javac -version.
                        Both commands should display version information.
                        If javac is not found, check the JDK installation and PATH.
                        Create a Java project and run a class containing main().
                        """;
                code = """
                        public class Main {
                            public static void main(String[] args) {
                                System.out.println(System.getProperty("java.version"));
                            }
                        }
                        """;
                exercise = "Check java -version and javac -version. Create Main.java and print the installed Java version.";
                quiz = "Which command compiles Main.java? A) java Main.java B) javac Main.java C) run Main D) compile\nAnswer: B) javac Main.java";
            } else if (title.contains("first java program") || title.contains("write and run")) {
                content = """
                        A Java application typically starts in the main method.
                        A class groups related code. Statements normally end with semicolons.
                        System.out.println prints a value followed by a newline.
                        Java identifiers are case-sensitive.
                        """;
                code = """
                        public class Main {
                            public static void main(String[] args) {
                                System.out.println("Welcome to SRH CodeVerse!");
                                System.out.println(10 + 20);
                            }
                        }
                        """;
                exercise = "Print your name, course, and the result of 25 + 17.";
                quiz = "What is the usual Java application entry point? A) start() B) main() C) print() D) init()\nAnswer: B) main()";
            } else if (title.contains("variables") || title.contains("primitive data")) {
                content = """
                        A variable stores a value under a name and has a declared type.
                        Common primitive types include int, long, double, char and boolean.
                        Use int for whole numbers and double for decimal calculations.
                        Choose meaningful names and initialize local variables before reading them.
                        String is a reference type, not a primitive type.
                        """;
                code = """
                        public class Main {
                            public static void main(String[] args) {
                                String name = "Siddu";
                                int age = 22;
                                double score = 86.5;
                                boolean active = true;
                                System.out.println(name + ": " + age + ", " + score + ", " + active);
                            }
                        }
                        """;
                exercise = "Declare variables for a product name, quantity and price. Print them and calculate quantity multiplied by price.";
                quiz = "Which is a primitive type? A) String B) Integer C) int D) Scanner\nAnswer: C) int";
            } else if (title.contains("operators")) {
                content = """
                        Arithmetic operators include +, -, *, / and %.
                        Relational operators compare values; logical operators include &&, || and !.
                        Integer division truncates the fractional part: 7 / 2 evaluates to 3.
                        Use parentheses to make complex expressions clear.
                        """;
                code = """
                        public class Main {
                            public static void main(String[] args) {
                                int a = 7, b = 2;
                                System.out.println(a / b);
                                System.out.println(a % b);
                                System.out.println((double) a / b);
                            }
                        }
                        """;
                exercise = "Try different values for a and b. Print their sum, product, quotient and remainder.";
                quiz = "What is 7 % 2? A) 3 B) 1 C) 3.5 D) 0\nAnswer: B) 1";
            } else if (title.contains("scanner") || title.contains("reading input")) {
                content = """
                        Scanner reads input from a source such as System.in.
                        nextInt reads an integer; nextLine reads a line of text.
                        After nextInt, a newline may remain in the input buffer.
                        Consume that newline before using nextLine for a full line.
                        Close a Scanner when its input is no longer needed.
                        """;
                code = """
                        import java.util.Scanner;

                        public class Main {
                            public static void main(String[] args) {
                                Scanner scanner = new Scanner(System.in);
                                System.out.print("Enter your name: ");
                                String name = scanner.nextLine();
                                System.out.print("Enter your age: ");
                                int age = scanner.nextInt();
                                System.out.println(name + " is " + age + " years old.");
                                scanner.close();
                            }
                        }
                        """;
                exercise = "Read two integers and print their sum. Test with positive and negative values.";
                quiz = "Which Scanner method reads a complete line? A) nextInt() B) nextLine() C) readInt() D) input()\nAnswer: B) nextLine()";
            } else if (title.contains("type casting") || title.contains("conversions")) {
                content = """
                        Widening conversions such as int to double are generally automatic.
                        Narrowing conversions such as double to int require an explicit cast.
                        Narrowing can lose information: (int) 5.9 produces 5.
                        Convert only when the resulting precision and range are acceptable.
                        """;
                code = """
                        public class Main {
                            public static void main(String[] args) {
                                int whole = 5;
                                double decimal = whole;
                                int truncated = (int) 5.9;
                                System.out.println(decimal);
                                System.out.println(truncated);
                            }
                        }
                        """;
                exercise = "Convert a double to int and compare the result. Explain why the decimal part is lost.";
                quiz = "What is (int) 8.7? A) 9 B) 8 C) 8.7 D) Error\nAnswer: B) 8";
            } else if (title.equals("if, else-if and switch")) {
                content = """
                        if and else choose a path based on a boolean condition.
                        else if checks additional conditions when earlier conditions are false.
                        switch selects a branch based on a matching value.
                        Keep conditions readable and include a suitable default branch in switch statements.
                        """;
                code = """
                        public class Main {
                            public static void main(String[] args) {
                                int marks = 75;
                                if (marks >= 85) {
                                    System.out.println("Distinction");
                                } else if (marks >= 35) {
                                    System.out.println("Pass");
                                } else {
                                    System.out.println("Fail");
                                }
                            }
                        }
                        """;
                exercise = "Read a mark and print Pass or Fail using 35 as the passing mark. Test 34, 35 and 90.";
                quiz = "Which branch runs when an if condition is false and there is no matching else-if? A) if again B) else C) all branches D) none ever\nAnswer: B) else";
            } else if (title.contains("loops") || title.contains("for, while")) {
                content = """
                        Loops repeat a block of code.
                        A for loop is useful when the iteration pattern is known.
                        A while loop checks its condition before each iteration.
                        A do-while loop runs its body at least once.
                        Ensure the loop condition eventually becomes false.
                        """;
                code = """
                        public class Main {
                            public static void main(String[] args) {
                                for (int i = 1; i <= 5; i++) {
                                    System.out.println(i);
                                }
                            }
                        }
                        """;
                exercise = "Print numbers 1 through 10 and then calculate their sum.";
                quiz = "Which loop always executes its body at least once? A) for B) while C) do-while D) enhanced for\nAnswer: C) do-while";
            } else if (title.equals("methods and parameters")) {
                content = """
                        A method is a named block of code that performs a task and can be reused.
                        Parameters are variables declared in the method signature; arguments are the values passed when calling it.
                        A void method performs an action without returning a result.
                        Keep methods focused on one responsibility and choose descriptive names.
                        """;
                code = """
                        public class Main {
                            static void greet(String name, int times) {
                                for (int i = 0; i < times; i++) {
                                    System.out.println("Hello, " + name);
                                }
                            }
                            public static void main(String[] args) {
                                greet("Anu", 2);
                            }
                        }
                        """;
                exercise = "Write a method called printTable that accepts an integer and prints its multiplication table from 1 to 10.";
                quiz = "In greet(String name, int times), which items are parameters? A) name and times B) Hello and Anu C) main only D) System.out\nAnswer: A) name and times";
            } else if (title.equals("return values and method overloading")) {
                content = """
                        A return type specifies the kind of result a method sends back to its caller.
                        Use return to send a result from a non-void method.
                        Method overloading allows methods to share a name when their parameter lists differ.
                        Changing only the return type does not create a valid overload.
                        """;
                code = """
                        public class Main {
                            static int square(int value) {
                                return value * value;
                            }
                            static int add(int a, int b) {
                                return a + b;
                            }
                            static double add(double a, double b) {
                                return a + b;
                            }
                            public static void main(String[] args) {
                                System.out.println(square(5));
                                System.out.println(add(2, 3));
                                System.out.println(add(2.5, 3.5));
                            }
                        }
                        """;
                exercise = "Create overloaded area methods for a square (one side) and a rectangle (length and width). Return the calculated area from each method.";
                quiz = "Can two methods be overloaded by changing only their return types? A) Yes B) No\nAnswer: B) No";
            } else if (title.equals("one-dimensional arrays")) {
                content = """
                        A one-dimensional array stores a fixed-size sequence of values of the same declared type.
                        Declare an array with a type and brackets, then access each element using a zero-based index.
                        The length property gives the number of elements; the last valid index is length - 1.
                        A for loop is useful when the index is needed, while an enhanced for loop is convenient for reading every value.
                        """;
                code = """
                        public class Main {
                            public static void main(String[] args) {
                                int[] marks = {70, 85, 90, 65, 80};
                                int total = 0;
                                int highest = marks[0];
                                for (int mark : marks) {
                                    total += mark;
                                    if (mark > highest) {
                                        highest = mark;
                                    }
                                }
                                System.out.println("Highest: " + highest);
                                System.out.println("Average: " + total / (double) marks.length);
                            }
                        }
                        """;
                exercise = "Create an array containing five integers. Print each value, the total, the average, and the largest value.";
                quiz = "For int[] values = {4, 8, 12}, what is values.length? A) 2 B) 3 C) 4 D) 12\nAnswer: B) 3";
            } else if (title.equals("two-dimensional arrays")) {
                content = """
                        A two-dimensional array represents data in rows and columns, such as a grid or marks table.
                        In Java, an int[][] contains references to row arrays, so rows can have different lengths.
                        Use nested loops to visit each row and each column.
                        For a rectangular array, grid.length is the row count and grid[row].length is that row's column count.
                        """;
                code = """
                        public class Main {
                            public static void main(String[] args) {
                                int[][] marks = {
                                    {80, 90, 85},
                                    {70, 75, 95}
                                };
                                for (int row = 0; row < marks.length; row++) {
                                    int total = 0;
                                    for (int col = 0; col < marks[row].length; col++) {
                                        total += marks[row][col];
                                    }
                                    System.out.println("Student " + (row + 1) + ": " + total);
                                }
                            }
                        }
                        """;
                exercise = "Create a 3-by-3 integer matrix. Print the matrix row by row and calculate the sum of each row.";
                quiz = "Which expression gives the number of rows in int[][] grid? A) grid.length B) grid[0] C) grid.length() D) grid[0].length\nAnswer: A) grid.length";            } else if (title.contains("string")) {
                content = """
                        String represents text and is immutable: operations create new strings.
                        Use equals to compare string contents, not ==.
                        Useful methods include length, substring, contains, trim and toUpperCase.
                        Use StringBuilder when repeatedly building a string in a loop.
                        """;
                code = """
                        public class Main {
                            public static void main(String[] args) {
                                String language = "Java";
                                System.out.println(language.length());
                                System.out.println(language.equals("Java"));
                                System.out.println(language.toUpperCase());
                            }
                        }
                        """;
                exercise = "Read a sentence and print its length, uppercase version and whether it contains the word Java.";
                quiz = "Which method compares String contents? A) == B) equals() C) = D) compareRef()\nAnswer: B) equals()";
            } else if (title.equals("classes and objects")) {
                content = """
                        A class defines the fields (state) and methods (behavior) shared by its objects.
                        An object is an instance of a class, created with the new keyword.
                        Use the dot operator to access accessible fields and call methods on an object.
                        Instance fields belong to each object, while static members belong to the class.
                        """;
                code = """
                        class Student {
                            String name;
                            int marks;

                            void printDetails() {
                                System.out.println(name + ": " + marks);
                            }
                        }

                        public class Main {
                            public static void main(String[] args) {
                                Student first = new Student();
                                first.name = "Anu";
                                first.marks = 85;

                                Student second = new Student();
                                second.name = "Ravi";
                                second.marks = 92;

                                first.printDetails();
                                second.printDetails();
                            }
                        }
                        """;
                exercise = "Create a Book class with title and pageCount fields and a printDetails method. Create two Book objects with different values and display both.";
                quiz = "What does an object represent in Java? A) An instance of a class B) A package C) A loop D) A primitive type\nAnswer: A) An instance of a class";
            } else if (title.equals("constructors and this")) {
                content = """
                        A constructor initializes an object when it is created and has the same name as its class.
                        A constructor has no return type, not even void.
                        A parameterized constructor accepts values to initialize an object's state.
                        The this keyword refers to the current object and is commonly used to distinguish fields from parameters.
                        If no constructor is declared, Java provides a default no-argument constructor; declaring a constructor changes that behavior.
                        """;
                code = """
                        class Student {
                            private String name;
                            private int marks;

                            Student(String name, int marks) {
                                this.name = name;
                                this.marks = marks;
                            }

                            void printDetails() {
                                System.out.println(name + ": " + marks);
                            }
                        }

                        public class Main {
                            public static void main(String[] args) {
                                Student student = new Student("Anu", 88);
                                student.printDetails();
                            }
                        }
                        """;
                exercise = "Create a Product class with name and price fields. Initialize both through a parameterized constructor using this, then print the product details.";
                quiz = "In this.name = name, what does this.name refer to? A) The current object's field B) A local variable only C) The class package D) A return value\nAnswer: A) The current object's field";            } else if (title.contains("inheritance")) {
                content = """
                        Inheritance lets a subclass extend an existing class using extends.
                        Subclasses inherit accessible members and may override inherited methods.
                        Use inheritance for a genuine is-a relationship.
                        Java classes support single class inheritance; multiple interfaces can be implemented.
                        """;
                code = """
                        class Animal {
                            void sound() {
                                System.out.println("Animal sound");
                            }
                        }

                        class Dog extends Animal {
                            @Override
                            void sound() {
                                System.out.println("Bark");
                            }
                        }

                        public class Main {
                            public static void main(String[] args) {
                                new Dog().sound();
                            }
                        }
                        """;
                exercise = "Create a Vehicle parent class and a Car subclass with one additional behavior.";
                quiz = "Which keyword declares class inheritance? A) implements B) extends C) inherits D) superClass\nAnswer: B) extends";
            } else if (title.contains("polymorphism")) {
                content = """
                        Polymorphism allows one parent type or interface to represent different implementations.
                        Overriding enables runtime method dispatch based on the actual object.
                        A parent reference can point to a subclass instance.
                        Use polymorphism to write code that works with multiple implementations.
                        """;
                code = """
                        class Shape {
                            double area() { return 0; }
                        }

                        class Square extends Shape {
                            private final double side;
                            Square(double side) { this.side = side; }
                            @Override double area() { return side * side; }
                        }

                        public class Main {
                            public static void main(String[] args) {
                                Shape shape = new Square(4);
                                System.out.println(shape.area());
                            }
                        }
                        """;
                exercise = "Create a parent Payment class and two subclasses that implement different payment descriptions.";
                quiz = "Which method selection is associated with overriding at runtime? A) Runtime dispatch B) Compilation only C) Import D) Casting only\nAnswer: A) Runtime dispatch";
            } else if (title.contains("abstraction") || title.contains("interface")) {
                content = """
                        Abstraction exposes essential behavior while hiding implementation details.
                        An abstract class can contain both implemented and abstract methods.
                        An interface defines a contract that classes can implement.
                        Program to interfaces when multiple implementations may be needed.
                        """;
                code = """
                        interface Printable {
                            void print();
                        }

                        class Report implements Printable {
                            public void print() {
                                System.out.println("Printing report");
                            }
                        }

                        public class Main {
                            public static void main(String[] args) {
                                Printable item = new Report();
                                item.print();
                            }
                        }
                        """;
                exercise = "Create a Drawable interface and implement it in Circle and Rectangle classes.";
                quiz = "Which keyword implements an interface? A) extends B) implements C) interface D) package\nAnswer: B) implements";
            } else if (title.contains("encapsulation")) {
                content = """
                        Encapsulation keeps an object's internal state controlled.
                        Fields are often private, with public methods validating changes.
                        This prevents callers from placing an object into an invalid state.
                        Avoid exposing mutable internal data unnecessarily.
                        """;
                code = """
                        class BankAccount {
                            private double balance;

                            public void deposit(double amount) {
                                if (amount > 0) balance += amount;
                            }

                            public double getBalance() {
                                return balance;
                            }
                        }

                        public class Main {
                            public static void main(String[] args) {
                                BankAccount account = new BankAccount();
                                account.deposit(500);
                                System.out.println(account.getBalance());
                            }
                        }
                        """;
                exercise = "Add a withdrawal method that rejects amounts greater than the available balance.";
                quiz = "Which access modifier restricts direct access to a field within its class? A) public B) private C) static D) final\nAnswer: B) private";
            } else if (title.equals("arraylist")) {
                content = """
                        ArrayList is a resizable array that preserves insertion order and permits duplicates.
                        Use get(index) for indexed access, add(element) to append, and remove(index) to remove an item.
                        ArrayList is a useful default when reading elements by index is common.
                        """;
                code = """
                        import java.util.ArrayList;
                        public class Main {
                            public static void main(String[] args) {
                                ArrayList<String> tasks = new ArrayList<>();
                                tasks.add("Study Java");
                                tasks.add("Practise SQL");
                                tasks.add("Study Java");
                                tasks.remove(1);
                                System.out.println(tasks);
                                System.out.println(tasks.get(1));
                            }
                        }
                        """;
                exercise = "Create an ArrayList of five subject names. Add one, remove one, and print the remaining items.";
                quiz = "Does ArrayList allow duplicate elements? A) Yes B) No\nAnswer: A) Yes";
            } else if (title.equals("linkedlist")) {
                content = """
                        LinkedList implements both List and Deque.
                        It supports adding and removing elements at either end with methods such as addFirst and removeLast.
                        Indexed access generally requires traversal, so ArrayList is often preferable for frequent random access.
                        Choose a collection based on the operations your program performs most often.
                        """;
                code = """
                        import java.util.LinkedList;
                        public class Main {
                            public static void main(String[] args) {
                                LinkedList<String> line = new LinkedList<>();
                                line.add("Ravi");
                                line.add("Anu");
                                line.addFirst("Asha");
                                line.addLast("Kiran");
                                line.removeFirst();
                                System.out.println(line);
                            }
                        }
                        """;
                exercise = "Model a queue of people using LinkedList. Add three names, add one at the front, then remove the first person.";
                quiz = "Which method adds an element at the beginning of a LinkedList? A) addFirst() B) putFirstOnly() C) start() D) prependAll()\nAnswer: A) addFirst()";
            } else if (title.equals("hashset and treeset")) {
                content = """
                        Set represents a collection of unique elements.
                        HashSet does not guarantee iteration order.
                        TreeSet stores unique elements in sorted order using natural ordering or a comparator.
                        Use a Set when duplicates should be removed; choose TreeSet when sorted traversal is needed.
                        """;
                code = """
                        import java.util.HashSet;
                        import java.util.TreeSet;
                        public class Main {
                            public static void main(String[] args) {
                                HashSet<Integer> values = new HashSet<>();
                                values.add(30);
                                values.add(10);
                                values.add(30);
                                System.out.println("Unique values: " + values.size());
                                TreeSet<Integer> sorted = new TreeSet<>(values);
                                System.out.println("Sorted values: " + sorted);
                            }
                        }
                        """;
                exercise = "Read or create a list of integers, remove duplicates with HashSet, and print the unique values in ascending order using TreeSet.";
                quiz = "Which collection keeps elements sorted by natural order? A) HashSet B) TreeSet C) ArrayList D) LinkedList\nAnswer: B) TreeSet";
            } else if (title.equals("hashmap and treemap")) {
                content = """
                        Map stores values associated with unique keys.
                        HashMap offers key-based lookup without guaranteeing iteration order.
                        TreeMap orders entries by key.
                        put inserts or replaces a mapping, get retrieves a value, and containsKey checks for a key.
                        """;
                code = """
                        import java.util.HashMap;
                        import java.util.TreeMap;
                        public class Main {
                            public static void main(String[] args) {
                                HashMap<String, Integer> scores = new HashMap<>();
                                scores.put("Ravi", 78);
                                scores.put("Anu", 92);
                                System.out.println(scores.get("Anu"));
                                TreeMap<String, Integer> sorted = new TreeMap<>(scores);
                                System.out.println(sorted);
                            }
                        }
                        """;
                exercise = "Store five product names and prices in a HashMap. Check whether a product exists, then display all entries sorted by product name using TreeMap.";
                quiz = "Which collection stores key-value pairs ordered by key? A) HashSet B) TreeMap C) ArrayList D) Queue\nAnswer: B) TreeMap";
            } else if (title.equals("queue and deque")) {
                content = """
                        Queue represents items waiting to be processed, commonly in first-in, first-out order.
                        Deque supports insertion and removal at both ends.
                        ArrayDeque is a common implementation for queues and double-ended queues.
                        Use offer and poll for queue operations when handling an empty queue without exceptions is useful.
                        """;
                code = """
                        import java.util.ArrayDeque;
                        import java.util.Deque;
                        public class Main {
                            public static void main(String[] args) {
                                Deque<String> jobs = new ArrayDeque<>();
                                jobs.offerLast("Compile");
                                jobs.offerLast("Test");
                                jobs.offerFirst("Prepare");
                                System.out.println(jobs.pollFirst());
                                System.out.println(jobs);
                            }
                        }
                        """;
                exercise = "Use ArrayDeque to model a print queue. Add three jobs at the end, add an urgent job at the front, and process two jobs.";
                quiz = "Which interface supports adding and removing at both ends? A) Deque B) Map C) Set D) Comparator\nAnswer: A) Deque";            } else if (title.contains("iterator") || title.contains("enhanced for")) {
                content = """
                        The enhanced for loop visits each element in an array or iterable collection.
                        An Iterator provides explicit traversal with hasNext() and next().
                        Iterator.remove() can safely remove the current element when supported.
                        Avoid structurally modifying a collection during a for-each loop.
                        """;
                code = """
                        import java.util.ArrayList;
                        import java.util.Iterator;

                        public class Main {
                            public static void main(String[] args) {
                                var numbers = new ArrayList<>(List.of(1, 2, 3, 4));
                                Iterator<Integer> it = numbers.iterator();
                                while (it.hasNext()) {
                                    if (it.next() % 2 == 0) it.remove();
                                }
                                System.out.println(numbers);
                            }
                        }
                        """.replace("import java.util.Iterator;", "import java.util.Iterator;\nimport java.util.List;");
                exercise = "Use an Iterator to remove all odd numbers from a list without causing ConcurrentModificationException.";
                quiz = "Which method checks whether an Iterator has another element? A) next() B) hasNext() C) remove() D) size()\nAnswer: B) hasNext()";
            } else if (title.equals("checked and unchecked exceptions")) {
                content = """
                        An exception interrupts the normal flow of a program.
                        Checked exceptions are checked by the compiler and must be caught or declared.
                        Unchecked exceptions are RuntimeException subclasses and do not require a catch or throws declaration.
                        Choose specific exception types and handle failures the program can reasonably recover from.
                        """;
                code = """
                        import java.io.IOException;

                        public class Main {
                            static void loadFile() throws IOException {
                                throw new IOException("File could not be loaded");
                            }

                            public static void main(String[] args) {
                                try {
                                    loadFile();
                                } catch (IOException ex) {
                                    System.out.println("Handled: " + ex.getMessage());
                                }
                            }
                        }
                        """;
                exercise = "Write a method that declares IOException. Call it from main and handle the exception with a specific catch block. Also explain why NumberFormatException is unchecked.";
                quiz = "Which statement about checked exceptions is correct? A) They must be caught or declared B) They are always ignored C) They are all RuntimeException subclasses D) They cannot be handled\nAnswer: A) They must be caught or declared";
            } else if (title.equals("try-catch-finally and custom exceptions")) {
                content = """
                        A try block contains code that may throw an exception.
                        A catch block handles a matching exception type.
                        A finally block is used for cleanup and normally runs whether an exception occurs or not.
                        A custom exception represents an application-specific failure and can extend Exception or RuntimeException.
                        """;
                code = """
                        class InvalidAgeException extends Exception {
                            InvalidAgeException(String message) {
                                super(message);
                            }
                        }

                        public class Main {
                            static void checkAge(int age) throws InvalidAgeException {
                                if (age < 18) {
                                    throw new InvalidAgeException("Age must be at least 18");
                                }
                                System.out.println("Access allowed");
                            }

                            public static void main(String[] args) {
                                try {
                                    checkAge(16);
                                } catch (InvalidAgeException ex) {
                                    System.out.println(ex.getMessage());
                                } finally {
                                    System.out.println("Validation finished");
                                }
                            }
                        }
                        """;
                exercise = "Create an InvalidMarksException custom checked exception. Throw it when marks are outside 0â€“100, catch it, and print a cleanup message in finally.";
                quiz = "What is the purpose of a finally block? A) Define a class B) Perform cleanup code C) Declare a package D) Return an object\nAnswer: B) Perform cleanup code";
            } else if (title.contains("file reading") || title.contains("file writing")) {
                content = """
                        Java file APIs allow programs to persist and read data.
                        Files and Path from java.nio.file are convenient for common file tasks.
                        Handle IOException and choose a deliberate file location.
                        Do not assume a file exists or that the application has permission to access it.
                        """;
                code = """
                        import java.io.IOException;
                        import java.nio.file.Files;
                        import java.nio.file.Path;

                        public class Main {
                            public static void main(String[] args) throws IOException {
                                Path path = Path.of("notes.txt");
                                Files.writeString(path, "Learning Java");
                                System.out.println(Files.readString(path));
                            }
                        }
                        """;
                exercise = "Write a line to a text file, read it back, and explain what happens if the file path is invalid.";
                quiz = "Which class represents a file path in modern Java NIO? A) FileText B) Path C) ScannerPath D) StreamFile\nAnswer: B) Path";
            } else if (title.equals("jdbc connection lifecycle")) {
                content = """
                        JDBC is the standard Java API for connecting to relational databases.
                        A Connection represents a database session and is obtained through DriverManager or a DataSource.
                        Use try-with-resources to close connections reliably, including when an exception occurs.
                        Keep database credentials outside source code and handle SQLException appropriately.
                        """;
                code = """
                        import java.sql.Connection;
                        import java.sql.DriverManager;
                        import java.sql.SQLException;

                        public class Main {
                            public static void main(String[] args) {
                                String url = "jdbc:mysql://localhost:3306/srh_codeverse_db";
                                try (Connection connection =
                                         DriverManager.getConnection(url, System.getenv("DB_USER"),
                                                                      System.getenv("DB_PASSWORD"))) {
                                    System.out.println("Connected: " + !connection.isClosed());
                                } catch (SQLException ex) {
                                    System.out.println("Database connection failed: " + ex.getMessage());
                                }
                            }
                        }
                        """;
                exercise = "Write a Java program that opens a JDBC connection using environment variables for credentials, prints the connection status, and closes the connection with try-with-resources.";
                quiz = "Which JDBC object represents an active database session? A) ResultSet B) Connection C) PreparedStatement D) SQLException\nAnswer: B) Connection";
            } else if (title.equals("preparedstatement and resultset")) {
                content = """
                        PreparedStatement represents a precompiled SQL statement with parameter placeholders.
                        Use setter methods such as setInt and setString to bind values instead of concatenating user input.
                        ResultSet provides cursor-based access to rows returned by a query.
                        Call next() to move to a row and retrieve columns with methods such as getString or getInt.
                        """;
                code = """
                        import java.sql.Connection;
                        import java.sql.DriverManager;
                        import java.sql.PreparedStatement;
                        import java.sql.ResultSet;
                        import java.sql.SQLException;

                        public class Main {
                            public static void main(String[] args) throws SQLException {
                                String url = "jdbc:mysql://localhost:3306/srh_codeverse_db";
                                String sql = "SELECT name FROM students WHERE id = ?";
                                try (Connection connection = DriverManager.getConnection(
                                         url, System.getenv("DB_USER"), System.getenv("DB_PASSWORD"));
                                     PreparedStatement statement = connection.prepareStatement(sql)) {
                                    statement.setInt(1, 1);
                                    try (ResultSet result = statement.executeQuery()) {
                                        while (result.next()) {
                                            System.out.println(result.getString("name"));
                                        }
                                    }
                                }
                            }
                        }
                        """;
                exercise = "Using a local test database, query a student by ID with PreparedStatement, iterate through the ResultSet, and print the student's name. Use environment variables for credentials.";
                quiz = "Which call advances a ResultSet cursor to the next row? A) executeUpdate() B) next() C) setInt() D) commit()\nAnswer: B) next()";
            } else if (title.equals("transactions and batch operations")) {
                content = """
                        A transaction groups database operations into one logical unit of work.
                        commit() saves the transaction, while rollback() cancels uncommitted changes.
                        Disable auto-commit when several statements must succeed or fail together.
                        Batch operations collect multiple statements for execution with executeBatch().
                        Always roll back on failure and close JDBC resources reliably.
                        """;
                code = """
                        import java.sql.Connection;
                        import java.sql.DriverManager;
                        import java.sql.PreparedStatement;
                        import java.sql.SQLException;

                        public class Main {
                            public static void main(String[] args) throws SQLException {
                                String url = "jdbc:mysql://localhost:3306/srh_codeverse_db";
                                try (Connection connection = DriverManager.getConnection(
                                         url, System.getenv("DB_USER"), System.getenv("DB_PASSWORD"));
                                     PreparedStatement statement = connection.prepareStatement(
                                         "INSERT INTO audit_log(message) VALUES (?)")) {
                                    connection.setAutoCommit(false);
                                    try {
                                        statement.setString(1, "First event");
                                        statement.addBatch();
                                        statement.setString(1, "Second event");
                                        statement.addBatch();
                                        statement.executeBatch();
                                        connection.commit();
                                        System.out.println("Transaction committed");
                                    } catch (SQLException ex) {
                                        connection.rollback();
                                        throw ex;
                                    }
                                }
                            }
                        }
                        """;
                exercise = "Insert three records with JDBC batch operations inside one transaction. Commit when all operations succeed; roll back if any SQL operation fails.";
                quiz = "Which method cancels uncommitted changes in a JDBC transaction? A) close() B) executeBatch() C) rollback() D) next()\nAnswer: C) rollback()";
            } else if (title.contains("generics")) {
                content = """
                        Generics allow types to be parameters, improving compile-time safety.
                        List<String> restricts elements to strings without manual casts.
                        Generic methods can declare their own type parameter.
                        Primitive values use wrapper types such as Integer in generic collections.
                        """;
                code = """
                        import java.util.List;

                        public class Main {
                            static <T> void printAll(List<T> items) {
                                for (T item : items) System.out.println(item);
                            }

                            public static void main(String[] args) {
                                printAll(List.of("Java", "SQL", "Spring"));
                            }
                        }
                        """;
                exercise = "Write a generic method that returns the first element of a non-empty List<T>.";
                quiz = "What is a key benefit of generics? A) Runtime UI B) Compile-time type safety C) Automatic database D) Faster internet\nAnswer: B) Compile-time type safety";
            } else if (title.contains("lambda")) {
                content = """
                        A lambda expression provides a concise implementation of a functional interface.
                        It is commonly used with callbacks and collection operations.
                        The parameter and arrow syntax separates inputs from the expression or body.
                        Keep lambdas short and readable.
                        """;
                code = """
                        import java.util.List;

                        public class Main {
                            public static void main(String[] args) {
                                List<String> names = List.of("Asha", "Ravi", "Anu");
                                names.forEach(name -> System.out.println(name));
                            }
                        }
                        """;
                exercise = "Use a lambda to print only names longer than three characters.";
                quiz = "Which symbol separates lambda parameters from its body? A) => B) -> C) :: D) ==\nAnswer: B) ->";
            } else if (title.contains("stream")) {
                content = """
                        Streams process data through operations such as filter, map and reduce.
                        Intermediate operations are lazy; terminal operations trigger processing.
                        Streams do not normally store data themselves.
                        Avoid modifying the source collection while processing its stream.
                        """;
                code = """
                        import java.util.List;

                        public class Main {
                            public static void main(String[] args) {
                                List<Integer> values = List.of(1, 2, 3, 4, 5, 6);
                                int total = values.stream()
                                        .filter(n -> n % 2 == 0)
                                        .mapToInt(Integer::intValue)
                                        .sum();
                                System.out.println(total);
                            }
                        }
                        """;
                exercise = "Use a stream to filter numbers greater than 10, double them, and collect the results into a list.";
                quiz = "Which operation triggers a stream pipeline? A) filter B) map C) collect D) peek\nAnswer: C) collect";
            } else if (title.contains("optional") || title.contains("null")) {
                content = """
                        Null references can cause NullPointerException when dereferenced.
                        Optional<T> represents a value that may or may not be present.
                        Use ofNullable for possibly-null values and orElse/orElseGet for fallback behavior.
                        Avoid using Optional as a replacement for every nullable field or parameter.
                        """;
                code = """
                        import java.util.Optional;

                        public class Main {
                            public static void main(String[] args) {
                                String input = null;
                                String result = Optional.ofNullable(input).orElse("Guest");
                                System.out.println(result);
                            }
                        }
                        """;
                exercise = "Write a method that returns an Optional<String> and provide a fallback when no value is present.";
                quiz = "Which method provides a fallback for an empty Optional? A) orElse() B) getAlways() C) fallback() D) nullValue()\nAnswer: A) orElse()";
            } else if (title.contains("record") || title.contains("enum")) {
                content = """
                        An enum defines a fixed set of named constants.
                        A record is a concise way to model data with components and generated accessors.
                        Records are shallowly immutable; referenced mutable objects may still change.
                        Use enums for fixed choices and records for simple data carriers.
                        """;
                code = """
                        enum Status { NEW, IN_PROGRESS, DONE }

                        record Task(String title, Status status) {}

                        public class Main {
                            public static void main(String[] args) {
                                Task task = new Task("Learn Java", Status.IN_PROGRESS);
                                System.out.println(task.title() + ": " + task.status());
                            }
                        }
                        """;
                exercise = "Create an enum for order status and a record for an order with an ID and status.";
                quiz = "How do you access a record component named title? A) getTitle() always B) title() C) title D) componentTitle()\nAnswer: B) title()";
            } else if (title.equals("introduction to spring")) {
                content = """
                        Spring is a Java framework for building maintainable applications.
                        The Spring container creates and manages objects called beans.
                        Spring Boot simplifies configuration and application startup through auto-configuration and starter dependencies.
                        A Spring Boot application commonly starts from a class annotated with @SpringBootApplication.
                        """;
                code = """
                        import org.springframework.boot.SpringApplication;
                        import org.springframework.boot.autoconfigure.SpringBootApplication;

                        @SpringBootApplication
                        public class Application {
                            public static void main(String[] args) {
                                SpringApplication.run(Application.class, args);
                            }
                        }
                        """;
                exercise = "Create a minimal Spring Boot application and explain the purpose of @SpringBootApplication and SpringApplication.run().";
                quiz = "Which annotation is commonly used on a Spring Boot main class? A) @Entity B) @SpringBootApplication C) @Override D) @Table\nAnswer: B) @SpringBootApplication";
            } else if (title.equals("dependency injection concept")) {
                content = """
                        Dependency injection (DI) provides an object with the dependencies it needs instead of having it create them.
                        Constructor injection makes required dependencies explicit and supports unit testing.
                        Spring can automatically provide a single-constructor dependency when creating a managed bean.
                        Depending on interfaces rather than concrete implementations reduces coupling.
                        """;
                code = """
                        interface MessageService {
                            String getMessage();
                        }

                        class GreetingService {
                            private final MessageService messageService;

                            GreetingService(MessageService messageService) {
                                this.messageService = messageService;
                            }

                            String greet() {
                                return messageService.getMessage();
                            }
                        }
                        """;
                exercise = "Create a service class that receives a dependency through its constructor. Explain how this makes the class easier to test.";
                quiz = "What is a key benefit of constructor injection? A) It removes all classes B) It makes required dependencies explicit C) It replaces Java methods D) It automatically creates database tables\nAnswer: B) It makes required dependencies explicit";
            } else if (title.equals("build a layered java application")) {
                content = """
                        A layered Java application separates responsibilities to make code easier to maintain and test.
                        The controller handles incoming HTTP requests and returns responses.
                        The service layer contains business rules and coordinates operations.
                        The repository layer handles data access, while model or entity classes represent application data.
                        Keep controllers thin and avoid placing business logic directly in controllers.
                        """;
                code = """
                        // Model
                        class Product {
                            private final String name;

                            Product(String name) {
                                this.name = name;
                            }

                            String getName() {
                                return name;
                            }
                        }

                        // Service
                        class ProductService {
                            Product createProduct(String name) {
                                return new Product(name);
                            }
                        }

                        // Controller-like entry point
                        class ProductController {
                            private final ProductService service;

                            ProductController(ProductService service) {
                                this.service = service;
                            }

                            Product create(String name) {
                                return service.createProduct(name);
                            }
                        }
                        """;
                exercise = "Design a small product application with model, controller, service and repository layers. Describe the responsibility of each layer.";
                quiz = "Which layer should contain business rules? A) Controller B) Service C) HTML D) Database driver\nAnswer: B) Service";
            } else if (title.contains("design a console project")) {
                content = """
                        Start by defining the users, features, inputs and expected outputs.
                        Split responsibilities into small classes and methods.
                        Validate input, handle expected errors and separate data from menu logic.
                        Test normal cases, invalid input and boundary conditions.
                        A student management project can support add, list, search, update and delete operations.
                        """;
                code = """
                        import java.util.Scanner;

                        public class Main {
                            public static void main(String[] args) {
                                try (Scanner scanner = new Scanner(System.in)) {
                                    System.out.print("Enter student name: ");
                                    String name = scanner.nextLine().trim();
                                    if (name.isEmpty()) {
                                        System.out.println("Name is required.");
                                    } else {
                                        System.out.println("Student: " + name);
                                    }
                                }
                            }
                        }
                        """;
                exercise = "Plan a console Student Management System. List its classes, menu options, validation rules and at least five test cases.";
                quiz = "What should be done before implementing a project? A) Ignore requirements B) Define requirements C) Delete data D) Skip testing\nAnswer: B) Define requirements";
            } else {
                content = "## Learning objectives\nUnderstand the core idea of " + lesson.getTitle() + ".\n\n" +
                        "## Study approach\nRead the topic carefully, run the example, change one part at a time, and observe the output. " +
                        "Check edge cases and explain why the program behaves as it does.\n\n" +
                        "## Practice\nComplete the exercise and verify the result before marking the lesson complete.";
                code = """
                        public class Main {
                            public static void main(String[] args) {
                                System.out.println("Practising Java: " + "%s");
                            }
                        }
                        """.formatted(lesson.getTitle().replace("\"", ""));
                exercise = "Write a small Java program demonstrating " + lesson.getTitle() +
                        ". Explain each important line and test at least two cases.";
                quiz = "Review question: Explain the main concept in " + lesson.getTitle() +
                        " and give one example of when you would use it.";
            }

            lesson.setLessonContent(content);
            lesson.setCodeExample(code);
            lesson.setExercise(exercise);
            lesson.setQuiz(quiz);
            lessonRepository.save(lesson);
            updated++;
        }

        return updated;
    }
}

