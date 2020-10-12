export interface CoursePreferenceInput {
    courseCode: number | string;
    sections: (number | string)[];
    program: "Major" | "Double Major" | "Minor";
}