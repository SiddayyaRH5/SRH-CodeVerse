package com.srhcodeverse.backend.repository;

import com.srhcodeverse.backend.entity.Submission;
import com.srhcodeverse.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByStudentOrderBySubmittedAtDesc(User student);
    long countByStudent(User student);
    long countByProblemId(Long problemId);
    @org.springframework.data.jpa.repository.Query(
    	    "SELECT COUNT(DISTINCT s.problem.id) FROM Submission s WHERE s.student = :student AND s.status = 'PASSED'"
    	)
    	long countDistinctSolvedProblems(@org.springframework.data.repository.query.Param("student") User student);
    
    
    @org.springframework.data.jpa.repository.Query(
    	    "SELECT COUNT(s) FROM Submission s WHERE s.submittedAt >= :startOfDay"
    	)
    	long countTodaysSubmissions(@org.springframework.data.repository.query.Param("startOfDay") java.time.LocalDateTime startOfDay);

    	@org.springframework.data.jpa.repository.Query(
    	    "SELECT COUNT(DISTINCT s.student.id) FROM Submission s WHERE s.submittedAt >= :since"
    	)
    	long countActiveStudents(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
    	
    	
    	@org.springframework.data.jpa.repository.Query(
    		    "SELECT s.student.id, COUNT(DISTINCT s.problem.id) FROM Submission s WHERE s.status = 'PASSED' GROUP BY s.student.id"
    		)
    		List<Object[]> countSolvedGroupedByStudent();
    		
    		
    		@org.springframework.data.jpa.repository.Query(
    			    "SELECT FUNCTION('DATE', s.submittedAt), COUNT(s) FROM Submission s " +
    			    "WHERE s.student = :student AND s.submittedAt >= :since " +
    			    "GROUP BY FUNCTION('DATE', s.submittedAt)"
    			)
    			List<Object[]> countSubmissionsByDayForStudent(
    			    @org.springframework.data.repository.query.Param("student") User student,
    			    @org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
    		
    		
    		// Submissions per day, last 7 days
    		@org.springframework.data.jpa.repository.Query(
    		    "SELECT FUNCTION('DATE', s.submittedAt), COUNT(s) FROM Submission s " +
    		    "WHERE s.submittedAt >= :since GROUP BY FUNCTION('DATE', s.submittedAt) ORDER BY FUNCTION('DATE', s.submittedAt)"
    		)
    		List<Object[]> countSubmissionsByDay(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);
    		
    		
    	boolean existsByStudent_UsernameAndProblem_IdAndStatusAndSubmittedAtAfter(
    		        String username, Long problemId, com.srhcodeverse.backend.entity.Submission.Status status,
    		        java.time.LocalDateTime after);
    	
    	Optional<Submission> findFirstByStudentAndProblemIdOrderBySubmittedAtDesc(User student, Long problemId);
    	
    	List<Submission> findByStudentAndStatus(User student, Submission.Status status);
    	
    	
    	long countByStatus(Submission.Status status);

    	long countByStatusAndSubmittedAtAfter(Submission.Status status, java.time.LocalDateTime after);

    	List<Submission> findTop10ByOrderBySubmittedAtDesc();

    	@org.springframework.data.jpa.repository.Query(
    	    "SELECT s.problem.title, COUNT(s), SUM(CASE WHEN s.status = 'PASSED' THEN 1 ELSE 0 END) " +
    	    "FROM Submission s GROUP BY s.problem.id, s.problem.title"
    	)
    	List<Object[]> getAttemptsAndPassesByProblem();
    	
    	List<Submission> findTop15ByStudentOrderBySubmittedAtDesc(User student);
    	long countByStudentAndStatus(User student, Submission.Status status);
}