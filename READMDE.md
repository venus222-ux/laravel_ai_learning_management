Sprint Goal: LMS Core & AI MVP
Objective: Enable a user to log in, view a course, read a lesson, and use an AI tool to summarize the lesson or generate a quick quiz.

[LMS USER FLOW ARCHITECTURE]

[1. BROWSE COURSES] --------> [2. ENROLL] ----------------> [3. START COURSE]
   Home & Catalog Pages          Quick Enroll Action             CourseDetails.tsx
   Filter & Search Sections      Pivot Table Registration        Ordered Syllabus Tree
        |                                                                |
        v                                                                v
[6. CERTIFICATE GENERATED] <-- [5. COMPLETE LESSON] <-------- [4. READ LESSON & AI ENGINE]
   Automated Hook Trigger         Progress Calculations          LessonDetails View Canvas
   Dispatches Background Job     Pushes to Core User Pivot       Triggers AI Summary / Quiz Engine


------------------------------------------------------------

FLOW BREAKDOWN

1. BROWSE COURSES
   - Course catalog (filters, search, categories)
   - Landing page entry point

2. ENROLL
   - User enrolls in course
   - Creates user_course pivot record
   - Initializes progress tracking

3. START COURSE
   - Opens CourseDetails.tsx
   - Displays ordered syllabus tree
   - Selects first lesson

4. READ LESSON & AI ENGINE
   - LessonDetails view (main learning canvas)
   - AI features:
       * Summary generation
       * Quiz generation
       * Key points extraction
   - Updates lesson interaction state

5. COMPLETE LESSON
   - Progress calculation engine runs
   - Updates completion status
   - Pushes updates to user-course pivot

6. CERTIFICATE GENERATED
   - Triggered automatically when course completed
   - Background job dispatch (queue/worker)
   - Certificate issuance + storage

......
Day 5 should include:

Seeders, Pusher, Horizon,
ES: Course search, Lesson search, AI semantic search
