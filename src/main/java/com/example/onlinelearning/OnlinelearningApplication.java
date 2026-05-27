package com.example.onlinelearning;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

@SpringBootApplication
@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
public class OnlinelearningApplication {

	private static final List<Course> courses = new CopyOnWriteArrayList<>();

	static {
		// Preload Course 1: Full-Stack Java
		List<Lesson> javaLessons = new ArrayList<>();
		javaLessons.add(new Lesson("j1", "Spring Framework & Dependency Injection", "https://www.w3schools.com/html/mov_bbb.mp4", 
				"Welcome to Spring Framework! Dependency Injection (DI) is a technique where one object supplies the dependencies of another object. In Spring, the IoC (Inversion of Control) container manages application components and injects their dependencies automatically using annotations like @Autowired, @Component, and @Service. This promotes loose coupling, making your Java applications highly modular, testable, and easier to scale."));
		javaLessons.add(new Lesson("j2", "RESTful APIs with Spring MVC", "https://www.w3schools.com/html/movie.mp4", 
				"REST (Representational State Transfer) is an architectural style for designing networked applications. Spring MVC makes it simple to build RESTful web services. By annotating classes with @RestController and mapping requests with @GetMapping, @PostMapping, @PutMapping, or @DeleteMapping, you can easily handle HTTP requests, parse incoming JSON, and return clean JSON responses."));
		javaLessons.add(new Lesson("j3", "Database Integration with Spring Data JPA", "https://www.w3schools.com/html/mov_bbb.mp4", 
				"Spring Data JPA simplifies database access by eliminating boilerplates of traditional JDBC. By defining an interface that extends JpaRepository, Spring automatically generates CRUD implementation at runtime. We use Object-Relational Mapping (ORM) through Hibernate under the hood to map Java entities directly to MySQL database tables, enabling rapid and robust data querying."));
		javaLessons.add(new Lesson("j4", "Securing APIs with Spring Security & JWT", "https://www.w3schools.com/html/movie.mp4", 
				"Security is a vital aspect of enterprise web apps. Spring Security provides comprehensive authentication and authorization support. When paired with JSON Web Tokens (JWT), you can establish a stateless security architecture. The server verifies user credentials, generates a cryptographically signed token, and the client attaches this token in the Authorization header for all subsequent API requests."));

		courses.add(new Course("c-java", 
				"Mastering Full-Stack Java & Spring Boot", 
				"Learn to build production-grade web applications using Java 17+, Spring Boot, Spring MVC, JPA, and secure API layers. Perfect for aspiring backend architects.", 
				"Backend Development", 
				"32 Hours", 
				"Advanced", 
				javaLessons));

		// Preload Course 2: UI/UX & CSS
		List<Lesson> cssLessons = new ArrayList<>();
		cssLessons.add(new Lesson("u1", "Design Principles & Layout Hierarchy", "https://www.w3schools.com/html/movie.mp4", 
				"Visual design is the foundation of user engagement. Great designers rely on fundamental principles like contrast, proximity, alignment, and repetition. Establishing a clear visual hierarchy guides users naturally through your website, highlighting calls-to-action (CTAs) and organizing content structure efficiently. Typography and proper whitespace are critical elements to elevate interface readability."));
		cssLessons.add(new Lesson("u2", "Harmonious HSL Colors & Dark Themes", "https://www.w3schools.com/html/mov_bbb.mp4", 
				"The HSL (Hue, Saturation, Lightness) color model makes adjusting color pallets intuitive. Unlike Hex or RGB, modifying the lightness or saturation of an HSL color allows for effortless creation of secondary shades, hover states, and gorgeous dark/light mode toggles. Dark themes benefit from deep gray backgrounds (rather than pure black) combined with sleek, high-contrast neon accents."));
		cssLessons.add(new Lesson("u3", "Glassmorphism & Frosted Glass Styling", "https://www.w3schools.com/html/movie.mp4", 
				"Glassmorphism has taken modern UI design by storm. It mimics the look of frosted glass, giving layers a depth of field. To implement this in CSS, we use a semi-transparent background color (`rgba(255, 255, 255, 0.05)`), a thin translucent border, and the powerful `backdrop-filter: blur(12px)` property. Adding subtle box shadows creates a realistic 3D floating effect."));
		cssLessons.add(new Lesson("u4", "Micro-Animations with CSS Transitions", "https://www.w3schools.com/html/mov_bbb.mp4", 
				"Micro-animations are subtle visual feedback cues that trigger upon interaction, like button hovers, page loads, and active tab transitions. Using CSS transforms (`scale()`, `translate()`) paired with smooth transition ease-curves (`cubic-bezier`), you can make your user interfaces feel responsive, interactive, and alive without degrading browser rendering performance."));

		courses.add(new Course("c-css", 
				"Modern UI/UX Design & CSS Artistry", 
				"Master the art of creating breathtaking user interfaces. Learn advanced CSS, glassmorphism, responsive grids, custom HSL color systems, and modern micro-animations.", 
				"Design & Frontend", 
				"18 Hours", 
				"Intermediate", 
				cssLessons));

		// Preload Course 3: Python & ML
		List<Lesson> pyLessons = new ArrayList<>();
		pyLessons.add(new Lesson("p1", "Python Basics: Control Flow & Data Structures", "https://www.w3schools.com/html/mov_bbb.mp4", 
				"Python's clean, readable syntax makes it the gold standard for data science. This lesson reviews foundational programming structures: conditional checks, loops (for and while), and key built-in data types (lists, dictionaries, sets). Writing modular functions and understanding Python's dynamic typing system are key precursors to manipulating massive data volumes."));
		pyLessons.add(new Lesson("p2", "Data Manipulation with Numpy & Pandas", "https://www.w3schools.com/html/movie.mp4", 
				"Data is rarely clean. NumPy introduces high-performance multi-dimensional array operations, while Pandas introduces the powerful DataFrame object. Together, they allow developers to perform lightning-fast matrix computations, load CSVs, clean missing records, filter complex tables, and slice huge datasets in single, readable lines of code."));
		pyLessons.add(new Lesson("p3", "Data Visualization & Scikit-Learn Modeling", "https://www.w3schools.com/html/mov_bbb.mp4", 
				"A picture is worth a thousand rows. Visualization tools like Matplotlib and Seaborn help us identify trends, outliers, and correlations. From there, we dive into Scikit-Learn to construct our first predictive model. We will cover the basic mechanics of supervised learning, splitting datasets, training models, and computing accuracy scores using test data."));

		courses.add(new Course("c-python", 
				"Introduction to Python & Machine Learning", 
				"Step into the world of Artificial Intelligence. Master basic Python, analytical libraries like Pandas, and construct your first predictive data models.", 
				"Data Science", 
				"24 Hours", 
				"Beginner", 
				pyLessons));

		// Preload Course 4: JavaScript SPA
		List<Lesson> jsLessons = new ArrayList<>();
		jsLessons.add(new Lesson("js1", "ES6+ Modern JavaScript Syntaxes", "https://www.w3schools.com/html/movie.mp4", 
				"JavaScript has evolved rapidly since the ES6 update. This lesson explores arrow functions, destructuring objects and arrays, template literals, spread/rest operators, and standard modules. Mastering these modern patterns is crucial for writing efficient, clean asynchronous code using Promises and async/await syntax to fetch data from backend servers."));
		jsLessons.add(new Lesson("js2", "DOM Manipulation & Event Handlers", "https://www.w3schools.com/html/mov_bbb.mp4", 
				"The Document Object Model (DOM) represents the structure of web pages. By selecting elements using `querySelector` and listening to actions via `addEventListener`, JavaScript allows us to rewrite layouts on-the-fly. We can dynamically generate HTML list items, slide modals open, and create high-speed user interfaces without reloading the webpage."));
		jsLessons.add(new Lesson("js3", "Understanding LocalStorage & Syncing States", "https://www.w3schools.com/html/movie.mp4", 
				"LocalStorage provides key-value storage directly in the user's browser. Unlike session variables, LocalStorage data has no expiration, meaning saved records persist even after restarting the browser. We will learn to convert complex JavaScript objects to strings using `JSON.stringify()`, save them, and parse them back to build bulletproof local persistence."));

		courses.add(new Course("c-javascript", 
				"Mastering Modern JavaScript & SPA Architectures", 
				"Dive deep into ES6+ functions, asynchronous promises, dynamic DOM manipulation, LocalStorage syncing, and building reactive single-page client architectures.", 
				"Design & Frontend", 
				"20 Hours", 
				"Intermediate", 
				jsLessons));
	}

	public static void main(String[] args) {
		SpringApplication.run(OnlinelearningApplication.class, args);
	}

	// 1. Get all courses
	@GetMapping
	public List<Course> getAllCourses() {
		return courses;
	}

	// 2. Get course by ID
	@GetMapping("/{id}")
	public ResponseEntity<Course> getCourseById(@PathVariable String id) {
		return courses.stream()
				.filter(c -> c.getId().equalsIgnoreCase(id))
				.findFirst()
				.map(ResponseEntity::ok)
				.orElse(ResponseEntity.notFound().build());
	}

	// 3. Create course (Admin)
	@PostMapping
	public ResponseEntity<Course> createCourse(@RequestBody Course course) {
		if (course.getId() == null || course.getId().trim().isEmpty()) {
			course.setId("c-" + UUID.randomUUID().toString().substring(0, 8));
		}
		if (course.getLessons() == null) {
			course.setLessons(new ArrayList<>());
		}
		// Assure every lesson has an ID
		for (int i = 0; i < course.getLessons().size(); i++) {
			Lesson l = course.getLessons().get(i);
			if (l.getId() == null || l.getId().trim().isEmpty()) {
				l.setId("l-" + UUID.randomUUID().toString().substring(0, 6));
			}
		}
		courses.add(course);
		return ResponseEntity.status(HttpStatus.CREATED).body(course);
	}

	// 4. Update course (Admin)
	@PutMapping("/{id}")
	public ResponseEntity<Course> updateCourse(@PathVariable String id, @RequestBody Course updatedCourse) {
		for (int i = 0; i < courses.size(); i++) {
			Course current = courses.get(i);
			if (current.getId().equalsIgnoreCase(id)) {
				updatedCourse.setId(current.getId()); // lock ID
				if (updatedCourse.getLessons() == null) {
					updatedCourse.setLessons(new ArrayList<>());
				}
				for (int j = 0; j < updatedCourse.getLessons().size(); j++) {
					Lesson l = updatedCourse.getLessons().get(j);
					if (l.getId() == null || l.getId().trim().isEmpty()) {
						l.setId("l-" + UUID.randomUUID().toString().substring(0, 6));
					}
				}
				courses.set(i, updatedCourse);
				return ResponseEntity.ok(updatedCourse);
			}
		}
		return ResponseEntity.notFound().build();
	}

	// 5. Delete course (Admin)
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteCourse(@PathVariable String id) {
		boolean removed = courses.removeIf(c -> c.getId().equalsIgnoreCase(id));
		if (removed) {
			return ResponseEntity.noContent().build();
		}
		return ResponseEntity.notFound().build();
	}

	// Model Classes (Static Inner to minimize folder structures)
	public static class Course {
		private String id;
		private String title;
		private String description;
		private String category;
		private String duration;
		private String level;
		private List<Lesson> lessons;

		public Course() {}

		public Course(String id, String title, String description, String category, String duration, String level, List<Lesson> lessons) {
			this.id = id;
			this.title = title;
			this.description = description;
			this.category = category;
			this.duration = duration;
			this.level = level;
			this.lessons = lessons;
		}

		public String getId() { return id; }
		public void setId(String id) { this.id = id; }

		public String getTitle() { return title; }
		public void setTitle(String title) { this.title = title; }

		public String getDescription() { return description; }
		public void setDescription(String description) { this.description = description; }

		public String getCategory() { return category; }
		public void setCategory(String category) { this.category = category; }

		public String getDuration() { return duration; }
		public void setDuration(String duration) { this.duration = duration; }

		public String getLevel() { return level; }
		public void setLevel(String level) { this.level = level; }

		public List<Lesson> getLessons() { return lessons; }
		public void setLessons(List<Lesson> lessons) { this.lessons = lessons; }
	}

	public static class Lesson {
		private String id;
		private String title;
		private String videoUrl;
		private String content;

		public Lesson() {}

		public Lesson(String id, String title, String videoUrl, String content) {
			this.id = id;
			this.title = title;
			this.videoUrl = videoUrl;
			this.content = content;
		}

		public String getId() { return id; }
		public void setId(String id) { this.id = id; }

		public String getTitle() { return title; }
		public void setTitle(String title) { this.title = title; }

		public String getVideoUrl() { return videoUrl; }
		public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

		public String getContent() { return content; }
		public void setContent(String content) { this.content = content; }
	}
}
