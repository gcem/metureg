export interface CoursePreference {
    courseCode: string;
    sections: Set<number>;
    program: "Major" | "Double Major" | "Minor";
}