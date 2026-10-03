import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  Layers,
  BookOpen,
  ClipboardCheck,
  Monitor,
  GraduationCap,
  ChevronRight,
  Info,
  CheckCircle2,
  Lightbulb,
  FileSpreadsheet,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const FranchiseHelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0); 

  const steps = [
    {
      title: "Category Structure",
      icon: <Layers size={20} />,
      badge: "Step 1",
      description: "Organize your subjects, classes, and sub-topics in a clean hierarchy.",
      color: "from-indigo-500 to-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
    },
    {
      title: "Question Library",
      icon: <BookOpen size={20} />,
      badge: "Step 2",
      description: "Build a rich pool of questions with options, explanations, and optional diagrams.",
      color: "from-emerald-500 to-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Test Assembly",
      icon: <ClipboardCheck size={20} />,
      badge: "Step 3",
      description: "Create tests, set timers, and map questions to build a challenge.",
      color: "from-amber-500 to-amber-600 bg-amber-500/10 text-amber-600 dark:text-amber-400"
    },
    {
      title: "Display Portal Setup",
      icon: <Monitor size={20} />,
      badge: "Step 4",
      description: "Map tests onto visual navigation views for the students.",
      color: "from-purple-500 to-purple-600 bg-purple-500/10 text-purple-600 dark:text-purple-400"
    },
    {
      title: "Student Hub Launch",
      icon: <GraduationCap size={20} />,
      badge: "Step 5",
      description: "Students launch your practice tests and get detailed breakdowns.",
      color: "from-blue-500 to-blue-600 bg-blue-50/10 text-blue-600 dark:text-blue-400"
    }
  ];

  return (
    <div className="container mx-auto py-8 max-w-6xl space-y-8 animate-in fade-in duration-500 pb-24">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 p-8 md:p-12 text-white shadow-xl shadow-indigo-100 dark:shadow-none">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 max-w-2xl space-y-4">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full backdrop-blur-md">
            Interactive Creator Academy
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
            Test Creation Guide
          </h1>
          <p className="text-white/80 text-base md:text-lg font-medium leading-relaxed">
            Follow this interactive checklist to effortlessly publish premium MCQ tests. Master categories, bulk upload questions, assign timers, and customize student portals.
          </p>
        </div>
      </div>

      {/* Interactive Step Navigator */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {steps.map((step, idx) => {
          const isActive = idx === activeStep;
          return (
            <button
              key={step.title}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-3xl border text-left transition-all duration-300 relative group cursor-pointer ${
                isActive
                  ? 'bg-card border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-600/10 dark:ring-indigo-500/25 shadow-lg shadow-indigo-100/50 dark:shadow-none'
                  : 'bg-card/45 border-slate-200 dark:border-zinc-800/80 hover:bg-card hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-3">
                <div className={`p-2 rounded-xl shrink-0 ${step.color.split(' ').slice(1).join(' ')}`}>
                  {step.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">{step.badge}</span>
              </div>
              <h3 className={`text-sm font-bold tracking-tight mb-1 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                {step.title}
              </h3>
              <p className="text-[11px] font-medium leading-snug text-slate-500 dark:text-zinc-400 line-clamp-2">
                {step.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Panel */}
      <div className="bg-card border border-slate-100 dark:border-zinc-800 shadow-xl dark:shadow-none rounded-[2.5rem] overflow-hidden">
        
        {/* Step 1: Category Management */}
        {activeStep === 0 && (
          <div className="p-6 md:p-12 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
              <div className="space-y-4 max-w-xl">
                <Badge className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/65 font-bold uppercase tracking-wider text-xs px-3 py-1 rounded-full">Hierarchy Engine</Badge>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Step 1: Set Up Your Subject Taxonomy</h2>
                <p className="text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
                  Before adding questions, establish a hierarchy using the **Category** section. Categories allow you to classify MCQs by broad domains (e.g. Science), sub-subjects (e.g. Biology), and specific lessons.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline" className="border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 font-semibold px-3 py-1 rounded-lg">1. Create Parent</Badge>
                  <Badge variant="outline" className="border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 font-semibold px-3 py-1 rounded-lg">2. Drag & Drop</Badge>
                  <Badge variant="outline" className="border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 font-semibold px-3 py-1 rounded-lg">3. Tree Navigation</Badge>
                </div>
              </div>
              <div className="w-full lg:w-96 p-6 rounded-3xl bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Recommended Structure</span>
                <div className="space-y-2 font-bold text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border text-indigo-600 dark:text-indigo-400 shadow-xs">
                    <Layers size={14} /> Subject (e.g., Mathematics)
                  </div>
                  <div className="ml-6 flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border text-emerald-600 dark:text-emerald-400 shadow-xs">
                    <ChevronRight size={12} className="text-slate-300" /> Class Level (e.g., Grade 10)
                  </div>
                  <div className="ml-12 flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border text-amber-600 dark:text-amber-400 shadow-xs">
                    <ChevronRight size={12} className="text-slate-300" /> Topic (e.g., Quadratic Equations)
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">1</div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Interactive Drag & Drop Tree</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Under **Category**, use the library view to click **Add Root** to establish main subjects. Simply drag and drop folders inside each other to rearrange structures dynamically.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">2</div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Rename and Edit Node Details</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Click any node in the tree structure to launch the right sidebar panel, allowing you to instantly rename, add child categories directly, or securely delete the node.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold leading-relaxed">
                <Info size={16} className="shrink-0" />
                <span>Make sure children nodes are properly aligned before mapping tests or questions for absolute consistency.</span>
              </div>
              <Button onClick={() => navigate('/category')} className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/10 shrink-0 gap-2">
                Configure Categories <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Question Library */}
        {activeStep === 1 && (
          <div className="p-6 md:p-12 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
              <div className="space-y-4 max-w-xl">
                <Badge className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/65 font-bold uppercase tracking-wider text-xs px-3 py-1 rounded-full">Question Bank</Badge>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Step 2: Add Questions & Options</h2>
                <p className="text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
                  Populate your database with MCQs. Under **Questions & Answers**, click **Create** to launch the editor. Specify the category, difficulties, custom text, and choose options with designated answers.
                </p>
              </div>
              
              <div className="w-full lg:w-96 p-5 rounded-3xl bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5"><FileSpreadsheet size={12} className="text-emerald-500" /> Excel Bulk Upload Option</span>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold leading-relaxed">
                  Have hundreds of questions? Click **Upload MCQ** in the question table page, download our sample template, fill it in, and import everything instantly!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div className="p-5 rounded-2xl border bg-card/50 space-y-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">A</div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Image Diagrams</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                  Support text with visual drawings by dropping files into the optional **Image Upload** box. Perfect for math graphs, physics diagrams, or geography maps.
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-card/50 space-y-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">B</div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Answers & Toggles</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                  Add 2 to 6 options for each question. Highlight the correct answer by simply checking the radio selection next to the text field inside the editor.
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-card/50 space-y-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">C</div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Explanations & Tags</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                  Fill in the **Question Explanation** field. Students will see this step-by-step resolution on their result page to help them self-educate and learn.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/10 border border-indigo-500/10 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <FileSpreadsheet size={16} /> Bulk Excel Columns Specification
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-[11px] font-bold">
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border shadow-2xs">Question Text*</div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border shadow-2xs">Difficulty (Easy/Medium/Hard)</div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border shadow-2xs">Explanation</div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border shadow-2xs">Option 1*</div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border shadow-2xs">Option 2*</div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border shadow-2xs">Correct Option Number (1-6)*</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                <Lightbulb size={16} className="text-amber-500" />
                <span>Tip: Add a custom tag (e.g. <code>JEE 2026</code>) to easily filter questions during test assembly.</span>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/question-ans/upload')} variant="outline" className="rounded-xl font-bold border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 shrink-0 gap-1.5">
                  <FileSpreadsheet size={16} /> Bulk Upload
                </Button>
                <Button onClick={() => navigate('/question-ans/create')} className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/10 shrink-0 gap-1.5">
                  <Plus size={16} /> Create Question
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Test Assembly */}
        {activeStep === 2 && (
          <div className="p-6 md:p-12 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
              <div className="space-y-4 max-w-xl">
                <Badge className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-950/65 font-bold uppercase tracking-wider text-xs px-3 py-1 rounded-full">Test Builder</Badge>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Step 3: Assemble Custom MCQ Tests</h2>
                <p className="text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
                  Go to **Tests** and click **Create Test** to design a challenge. Give your test a name, configure attempts, define duration parameters, and select questions from your category taxonomy.
                </p>
              </div>

              <div className="w-full lg:w-96 p-5 rounded-3xl bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 space-y-3 text-xs font-semibold">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-amber-500" /> Key Features Checklist</span>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Shuffle Questions (Anti-Cheat)</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Shuffle Options (Anti-Cheat)</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Configurable Duration in Minutes</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">1</div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Basic Metadata & Timing</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Set a clear Title and Duration. Shuffling options ensures that Option A for Student 1 will be Option C for Student 2, preventing academic dishonesty during live testing sessions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">2</div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Interactive Question Selection</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Inside the creator screen, browse your Category hierarchy, search specific tags, and check boxes to instantly map selected questions to this test.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold leading-relaxed">
                <Info size={16} className="shrink-0" />
                <span>You can edit tests to add or remove questions at any point before students start attempts.</span>
              </div>
              <Button onClick={() => navigate('/test/create')} className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/10 shrink-0 gap-1.5">
                <Plus size={16} /> Assemble Test
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Display Mapping */}
        {activeStep === 3 && (
          <div className="p-6 md:p-12 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
              <div className="space-y-4 max-w-xl">
                <Badge className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-100/50 dark:hover:bg-purple-950/65 font-bold uppercase tracking-wider text-xs px-3 py-1 rounded-full">Navigation View</Badge>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Step 4: Create Display Views & Maps</h2>
                <p className="text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
                  Go to **Display Views** to set up a visual catalog for students. These are stylized node directories (e.g. "Weekly Exams", "Prep Series") that house your tests.
                </p>
              </div>

              <div className="w-full lg:w-96 p-5 rounded-3xl bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 space-y-2 text-xs font-semibold">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">How it works</span>
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-zinc-900 border"><span className="h-2 w-2 rounded-full bg-purple-500" /> Create Display View Root</div>
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-zinc-900 border"><span className="h-2 w-2 rounded-full bg-purple-500" /> Build child directories</div>
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-zinc-900 border"><span className="h-2 w-2 rounded-full bg-purple-500" /> Click Assign Test on any node</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">1</div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Catalog Design (Folder Nodes)</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Instead of a flat test list, Display Views allow you to build custom directories. Students will navigate these folders in their Practice section, making browsing extremely clean.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">2</div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Assign Tests to Specific Nodes</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Click any folder node in the Display View interface, click **Assign Test** in the menu, and choose which created tests should be instantly published inside this folder!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold leading-relaxed">
                <Info size={16} className="shrink-0" />
                <span>Tests must be assigned to at least one Display View directory node in order to be visible in the student's Practice Hub.</span>
              </div>
              <Button onClick={() => navigate('/display-view')} className="rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/10 shrink-0 gap-1.5">
                Configure Display Views <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Student Hub */}
        {activeStep === 4 && (
          <div className="p-6 md:p-12 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
              <div className="space-y-4 max-w-xl">
                <Badge className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-950/65 font-bold uppercase tracking-wider text-xs px-3 py-1 rounded-full">Student Sandbox</Badge>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">Step 5: The Student Practice View</h2>
                <p className="text-slate-600 dark:text-zinc-400 font-medium leading-relaxed">
                  This is the final viewport! Once assigned, students go to **Practice**, browse your custom Display Views folder catalog, choose a test card, and launch their timed session.
                </p>
              </div>

              <div className="w-full lg:w-96 p-5 rounded-3xl bg-slate-50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 space-y-2 text-xs font-semibold">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">Student Features</span>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Interactive timer controls</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Bookmarking & Flagging items</div>
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Premium Scorecard & detailed review</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">1</div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">The Live Test Interface</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Designed to mimic major national exams. Includes responsive navigator grids, bookmark badges, clean white backing cards for high-contrast diagram illustrations, and double confirmation submit prompts.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">2</div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">Analytics & Detailed Reviews</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                    Upon submission, students get a premium scorecard showing passing badges, accuracy indices, correct/incorrect counters, and an interactive review sheet featuring your step-by-step explanations.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                <Lightbulb size={16} className="text-amber-500" />
                <span>Tip: Encourage students to review their attempts inside their **History** section to track their progress over time.</span>
              </div>
              <Button onClick={() => navigate('/practice')} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/10 shrink-0 gap-1.5">
                Launch Practice Hub <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Frequently Asked Questions Accordion Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-black tracking-tight flex items-center gap-2 text-slate-800 dark:text-zinc-100">
          <HelpCircle size={20} className="text-indigo-600 dark:text-indigo-400" /> Frequently Asked Questions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-slate-100 dark:border-zinc-800/80 rounded-2xl bg-card shadow-xs">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" /> How do I map questions to a test?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
              Go to **Tests**, click **Edit** or **Create**, scroll to the bottom question selector, browse categories in the left tree, check individual questions in the right column, and save the form.
            </CardContent>
          </Card>

          <Card className="border border-slate-100 dark:border-zinc-800/80 rounded-2xl bg-card shadow-xs">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" /> Why is my test not visible in the practice hub?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
              Your test has not been assigned to a display view node yet! Navigate to **Display Views**, select a folder in the hierarchy, click **Assign Test** inside the right panel, select your test, and save.
            </CardContent>
          </Card>

          <Card className="border border-slate-100 dark:border-zinc-800/80 rounded-2xl bg-card shadow-xs">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" /> How does the Excel bulk uploader work?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
              Click **Upload MCQ** in the Question list page, click the **Download Sample Template** link, fill in your questions following the strict column list, choose the file inside the upload box, and hit import!
            </CardContent>
          </Card>

          <Card className="border border-slate-100 dark:border-zinc-800/80 rounded-2xl bg-card shadow-xs">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" /> How do I configure anti-cheating?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
              Under the test details editor, simply check the **Shuffle Questions** and **Shuffle Options** checkboxes. This shuffles items dynamically for each individual attempt in the database.
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
};

export default FranchiseHelpPage;
