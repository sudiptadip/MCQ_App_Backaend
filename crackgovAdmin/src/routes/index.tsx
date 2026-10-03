import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import HomePage from "../pages/home/HomePage";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import PublicRoute from "../components/auth/PublicRoute";
import FranchiseList from "../pages/franchise/FranchiseList";
import FranchiseFormPage from "../pages/franchise/FranchiseFormPage";
import StudentList from "../pages/student/StudentList";
import StudentFormPage from "../pages/student/StudentFormPage";
import StudentDetailsPage from "../pages/student/StudentDetailsPage";
import CategoryListPage from "../pages/category/CategoryListPage";
import UpsertCategoryPage from "../pages/category/UpsertCategoryPage";
import McqQuestionAnsListPage from "../pages/mcq/McqQuestionAnsListPage";
import UpsertMcqQuestionAnsPage from "../pages/mcq/UpsertMcqQuestionAnsPage";
import UploadMcqQuestionAnsPage from "../pages/mcq/UploadMcqQuestionAnsPage";
import TestListPage from "../pages/test/TestListPage";
import UpsertTestPage from "../pages/test/UpsertTestPage";
import TestDetailsPage from "../pages/test/TestDetailsPage";
import DisplayViewListPage from "../pages/display-view/DisplayViewListPage";
import UpsertDisplayViewPage from "../pages/display-view/UpsertDisplayViewPage";
import StudyMaterialListPage from "../pages/study-material/StudyMaterialListPage";
import UpsertStudyMaterialPage from "../pages/study-material/UpsertStudyMaterialPage";
import PracticeHomePage from "../pages/practice/PracticeHomePage";
import PracticeBrowsePage from "../pages/practice/PracticeBrowsePage";
import PracticeTestPage from "../pages/practice/PracticeTestPage";
import PracticeResultPage from "../pages/practice/PracticeResultPage";
import PracticeReviewPage from "../pages/practice/PracticeReviewPage";
import PracticeHistoryPage from "../pages/practice/PracticeHistoryPage";
import CustomPracticePage from "../pages/practice/CustomPracticePage";
import ComingSoonPage from "../pages/ComingSoonPage";
import LeaderboardPage from "../pages/leaderboard/LeaderboardPage";
import FranchiseHelpPage from "../pages/help/FranchiseHelpPage";
import AccessDeniedPage from "../pages/AccessDeniedPage";
import NotFoundPage from "../pages/NotFoundPage";
import StudentContentHomePage from "../pages/student-content/StudentContentHomePage";
import StudentContentBrowsePage from "../pages/student-content/StudentContentBrowsePage";
import { FeesManagementPage } from "../pages/fees/FeesManagementPage";
import { StudentFeesPage } from "../pages/fees/StudentFeesPage";


export const router = createBrowserRouter([
    // Protected Routes
    {
        path: "/",
        element: <ProtectedRoute />,
        children: [
            {
                element: <DashboardLayout />,
                children: [
                    {
                        index: true,
                        element: <HomePage />
                    },
                    {
                        path: "fees",
                        element: <FeesManagementPage />
                    },
                    {
                        path: "my-fees",
                        element: <StudentFeesPage />
                    },
                    {
                        path: "franchise",
                        children: [
                            {
                                index: true,
                                element: <FranchiseList />
                            },
                            {
                                path: "create",
                                element: <FranchiseFormPage />
                            },
                            {
                                path: "edit/:id",
                                element: <FranchiseFormPage />
                            }
                        ]
                    },
                    {
                        path: "student",
                        children: [
                            {
                                index: true,
                                element: <StudentList />
                            },
                            {
                                path: "create",
                                element: <StudentFormPage />
                            },
                            {
                                path: "details/:userId",
                                element: <StudentDetailsPage />
                            }
                        ]
                    },
                    {
                        path: "category",
                        children: [
                            {
                                index: true,
                                element: <CategoryListPage />
                            },
                            {
                                path: "create",
                                element: <UpsertCategoryPage />
                            },
                            {
                                path: "edit/:id",
                                element: <UpsertCategoryPage />
                            }
                        ]
                    },
                    {
                        path: "question-ans",
                        children: [
                            {
                                index: true,
                                element: <McqQuestionAnsListPage />
                            },
                            {
                                path: "create",
                                element: <UpsertMcqQuestionAnsPage />
                            },
                            {
                                path: "upload",
                                element: <UploadMcqQuestionAnsPage />
                            },
                            {
                                path: "edit/:id",
                                element: <UpsertMcqQuestionAnsPage />
                            }
                        ]
                    },
                    {
                        path: "test",
                        children: [
                            {
                                index: true,
                                element: <TestListPage />
                            },
                            {
                                path: "create",
                                element: <UpsertTestPage />
                            },
                            {
                                path: "edit/:id",
                                element: <UpsertTestPage />
                            },
                            {
                                path: "details/:id",
                                element: <TestDetailsPage />
                            }
                        ]
                    },
                    {
                        path: "display-view",
                        children: [
                            {
                                index: true,
                                element: <DisplayViewListPage />
                            },
                            {
                                path: "create",
                                element: <UpsertDisplayViewPage />
                            },
                            {
                                path: "edit/:id",
                                element: <UpsertDisplayViewPage />
                            }
                        ]
                    },
                    {
                        path: "study-material",
                        children: [
                            {
                                index: true,
                                element: <StudyMaterialListPage />
                            },
                            {
                                path: "create",
                                element: <UpsertStudyMaterialPage />
                            },
                            {
                                path: "edit/:id",
                                element: <UpsertStudyMaterialPage />
                            }
                        ]
                    },
                    {
                        path: "practice",
                        children: [
                            {
                                index: true,
                                element: <PracticeHomePage />
                            },
                            {
                                path: "custom",
                                element: <CustomPracticePage />
                            },
                            {
                                path: ":nodeId",
                                element: <PracticeBrowsePage />
                            },
                            {
                                path: "test/:testId",
                                element: <PracticeTestPage />
                            },
                            {
                                path: "result/:testId",
                                element: <PracticeResultPage />
                            },
                            {
                                path: "review/:attemptId",
                                element: <PracticeReviewPage />
                            },
                            {
                                path: "history",
                                element: <PracticeHistoryPage />
                            }
                        ]
                    },
                    {
                        path: "notes",
                        children: [
                            {
                                index: true,
                                element: <StudentContentHomePage type="notes" />
                            },
                            {
                                path: ":nodeId",
                                element: <StudentContentBrowsePage type="notes" />
                            }
                        ]
                    },
                    {
                        path: "videos",
                        children: [
                            {
                                index: true,
                                element: <StudentContentHomePage type="videos" />
                            },
                            {
                                path: ":nodeId",
                                element: <StudentContentBrowsePage type="videos" />
                            }
                        ]
                    },
                    {
                        path: "leaderboard",
                        element: <LeaderboardPage />
                    },
                    {
                        path: "settings",
                        element: <ComingSoonPage title="Settings" description="Settings and configuration options will be available here soon." />
                    },
                    {
                        path: "help",
                        element: <FranchiseHelpPage />
                    }
                ]
            }
        ]
    },
    // Public Auth Routes
    {
        element: <PublicRoute />,
        children: [
            {
                element: <AuthLayout />,
                children: [
                    {
                        path: "login",
                        element: <LoginPage />
                    },
                    {
                        path: "register",
                        element: <RegisterPage />
                    }
                ]
            }
        ]
    },
    // Error routes
    {
        path: "403",
        element: <AccessDeniedPage />
    },
    {
        path: "404",
        element: <NotFoundPage />
    },
    // Fallback redirect
    {
        path: "*",
        element: <Navigate to="/404" replace />
    }
])
