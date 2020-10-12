export interface CourseSection {
    courseCode: string;
    section: number;
    program: "Major" | "Double Major" | "Minor";
}