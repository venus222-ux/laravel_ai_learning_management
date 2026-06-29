import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLmsStore } from "../store/useLmsStore";
import API, { enrollCourse } from "../api";
import type { Course } from "../types";
import CourseCard from "../components/CourseCard";
import styles from "../styles/CourseCatalog.module.css";

export default function CourseCatalog() {
  const { courses, isLoadingLms, fetchCoursesList, executeSearch, searchResults, isSearching, clearSearch } = useLmsStore();
  
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"standard" | "semantic">("standard");
  const isSearchingMode = query.length > 2;

  useEffect(() => {
    fetchCoursesList();
  }, [fetchCoursesList]);

  useEffect(() => {
    if (isSearchingMode) {
      const delay = setTimeout(() => executeSearch(query, searchMode), 500);
      return () => clearTimeout(delay);
    } else {
      clearSearch();
    }
  }, [query, searchMode, executeSearch, clearSearch, isSearchingMode]);

  const handleEnroll = async (id: number) => {
    try {
      await enrollCourse(id);
      alert("Enrolled successfully!");
    } catch { alert("Failed to enroll."); }
  };

  if (isLoadingLms && courses.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Syncing Workspace...</p>
      </div>
    );
  }

  return (
    <div className={styles.catalogWrapper}>
      <header className={styles.catalogHeader}>
        <div className={styles.headerTag}>LMS PLATFORM</div>
        <h2>Explore Curriculums</h2>
        <p>Your personalized path to mastery starts here.</p>

        <div className={styles.searchContainer}>
          <input
            className={styles.searchBar}
            placeholder="Search topics, skills, or courses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className={styles.searchSelect} value={searchMode} onChange={(e) => setSearchMode(e.target.value as any)}>
            <option value="standard">Text Match</option>
            <option value="semantic">AI Semantic</option>
          </select>
        </div>
      </header>

      {isSearchingMode ? (
        <section>
          <h3 style={{ marginBottom: '1rem' }}>{isSearching ? "Searching..." : "Search Results"}</h3>
          {searchResults.map((result) => (
            <div key={`${result.id}`} className={styles.resultItem}>
              <div>
                <small style={{ color: '#6366f1', fontWeight: 700 }}>{result.index.toUpperCase()}</small>
                <h4>{result.data.title}</h4>
              </div>
              <Link to={`/courses/${result.id}`}>View →</Link>
            </div>
          ))}
        </section>
      ) : (
        <main className={styles.courseGrid}>
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} onEnroll={handleEnroll} />
          ))}
        </main>
      )}
    </div>
  );
}