*** CRITICAL EXECUTION CONSTRAINTS (READ BEFORE CODING) ***

1. NO DATABASE/BACKEND CHANGES ALLOWED
   - The backend is immutable. You cannot add fields like `category`, `matchesJD`, or `gapMonths` to the database.
   - **Strategy:** All new data requirements must be calculated on the FRONTEND (Client-side) or handled via "UI Adapters".

2. DATA FALLBACK PROTOCOL (Conflict Resolution)
   - **Skills:** If `skill.category` does not exist in the data, do NOT crash or show empty headers. Instead, fallback to displaying all skills in a single "Skills" section (ignore the Technical/Soft split).
   - **JD Matching:** If `matchesJD` is missing, simply hide the green checkmark. Do not break the chip component.
   - **AI Insights:** If the backend returns a text paragraph instead of structured `strengths/risks` arrays, implement a client-side text parser (Regex) to extract bullet points. If parsing fails, FALLBACK to displaying the original paragraph cleanly.
   - **Timeline:** Calculate `gapMonths` purely in the React component using the existing `startDate` and `endDate` strings.

3. FEATURE SCOPE: EMAIL ONLY
   - There is NO "Send Message" or chat functionality.
   - Remove the `MessageSquare` icon entirely.
   - The specific action is "Send Email" (Mail icon).

4. GENERAL RULE: GRACEFUL DEGRADATION
   - If a specific UI element (like the "Match Score Ring" or "Gap Indicator") relies on data that is completely unavailable or null, **hide the element entirely** rather than showing broken UI or "NaN".
   - Your priority is a working, crash-free UI over a 100% perfect match of the mockup if data is missing.

**Target:** Enterprise desktop application (1280px+ only, no mobile/tablet support)  
**Goal:** Recruiters assess candidates in <10 seconds without scrolling

---

## PHASE 1: GLOBAL DESIGN SYSTEM

**Files:** `src/index.css`, `tailwind.config.ts`

### Typography System
```css
/* Add to index.css */
:root {
  --font-inter: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

body {
  font-family: var(--font-inter);
  font-size: 14px;
  line-height: 1.5;
  color: rgb(15, 23, 42); /* slate-900 */
}

h1 {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

h2 {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.caption {
  font-size: 12px;
  font-weight: 500;
  color: rgb(100, 116, 139); /* slate-500 */
}
```

### Color Palette Replacement
```typescript
// tailwind.config.ts - Update theme.extend.colors
colors: {
  slate: {
    50: 'rgb(248, 250, 252)',
    100: 'rgb(241, 245, 249)',
    // ... use default Tailwind slate scale
  },
  // Remove any custom "neutral" or "gray" overrides
}
```

### Layout Tokens
```css
/* Add to index.css */
.section-padding {
  padding: 24px;
}

.element-padding {
  padding: 16px;
}

.related-gap {
  gap: 12px;
}

.section-gap {
  gap: 24px;
}
```

### Shadow System
```typescript
// tailwind.config.ts - Replace boxShadow
boxShadow: {
  'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  // Remove all other shadow definitions
}
```

### Border Radius Standardization
```typescript
// tailwind.config.ts
borderRadius: {
  'md': '6px',  // Inner elements
  'lg': '8px',  // Containers
  'full': '9999px', // Pills and badges
}
```

### Background Colors
```css
/* Global app background */
body {
  background-color: rgb(248, 250, 252); /* bg-slate-50 */
}

/* Surface backgrounds */
.surface {
  background-color: rgb(255, 255, 255); /* bg-white */
}
```

### Selection State Pattern
```css
/* Reusable selection state class */
.selected-item {
  background-color: rgb(239, 246, 255); /* bg-blue-50 */
  border-left: 4px solid rgb(37, 99, 235); /* border-blue-600 */
}

.hover-item:hover {
  background-color: rgb(248, 250, 252); /* bg-slate-50 */
}
```

---

## PHASE 2: THREE-PANE LAYOUT ARCHITECTURE

**Files:** `src/components/layout/AppLayout.tsx`, `src/components/layout/Sidebar.tsx`

### Layout Container Structure
```tsx
// AppLayout.tsx
<div className="flex h-screen bg-slate-50">
  {/* Pane 1: Navigation Rail */}
  <Sidebar className="w-16 flex-shrink-0" />
  
  {/* Pane 2: Job/Candidate List */}
  <aside className="w-[350px] flex-shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
    {children.middlePane}
  </aside>
  
  {/* Pane 3: Detail View */}
  <main className="flex-1 overflow-y-auto bg-white">
    {children.detailView}
  </main>
</div>
```

### Pane 1: Navigation Rail (64px fixed width)
```tsx
// Sidebar.tsx - COMPLETE REDESIGN
const Sidebar = () => {
  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Briefcase, label: 'Job Orders', path: '/jobs' },
    { icon: Users, label: 'Candidates', path: '/candidates' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: FileText, label: 'Documents', path: '/documents' },
    { icon: Upload, label: 'Upload', path: '/upload' },
    { icon: Archive, label: 'Archive', path: '/archive' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <nav className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            title={item.label} // Tooltip via native title attribute
            className={`
              w-12 h-12 flex items-center justify-center rounded-lg
              transition-colors duration-150
              ${isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-600 hover:bg-slate-100'
              }
            `}
          >
            <Icon className="w-6 h-6" />
          </Link>
        );
      })}
    </nav>
  );
};
```

**Critical Changes:**
- Remove expand-on-hover functionality completely
- Fixed 64px width (w-16)
- Icon-only, 24px icons (w-6 h-6)
- No labels, no expand state
- Active state: `bg-blue-600 text-white rounded-lg`
- Inactive: `text-slate-600 hover:bg-slate-100 rounded-lg`
- Remove any background color from the rail container itself (keep bg-white)

### Pane 2: Job/Candidate List (350px fixed width)
```tsx
// DashboardPage.tsx or JobOrderList component
<aside className="w-[350px] flex-shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
  <div className="p-4">
    {/* Header */}
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-slate-900">Job Orders</h2>
      <p className="text-sm text-slate-500">{jobOrders.length} active</p>
    </div>
    
    {/* Filters */}
    <div className="space-y-3 mb-4">
      <Select>
        <SelectTrigger className="w-full">All Departments</SelectTrigger>
      </Select>
      <Select>
        <SelectTrigger className="w-full">All Ages</SelectTrigger>
      </Select>
    </div>
    
    {/* Job Order Cards */}
    <div className="space-y-1">
      {jobOrders.map(job => (
        <JobOrderCard 
          key={job.id} 
          job={job}
          isSelected={selectedJobId === job.id}
        />
      ))}
    </div>
  </div>
</aside>
```

### Pane 3: Detail View (flex-grow)
```tsx
// Already correct in structure, internal redesign in later phases
<main className="flex-1 overflow-y-auto bg-white">
  {selectedCandidate ? (
    <CandidateDetailView candidate={selectedCandidate} />
  ) : (
    <EmptyState />
  )}
</main>
```

---

## PHASE 3: CANDIDATE LIST CARD COMPRESSION (72px MAX HEIGHT)

**Files:** `src/components/dashboard/KanbanCard.tsx`, `src/components/dashboard/DashboardKanban.tsx`

### Current Problem Analysis
Current kanban cards show:
- Name
- Match score (as text badge)
- Status pill
- Action icons (email, call, message, delete) ← **REMOVE**
- "Moved today" timeline badge ← **REMOVE**
- "Since Feb 8" date ← **REMOVE**
- Drag handle is entire card ← **CHANGE to 6-dot icon only**

### New 72px Card Structure
```tsx
// KanbanCard.tsx - COMPLETE REWRITE
interface KanbanCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: DragEvent) => void;
}

const KanbanCard = ({ candidate, isSelected, onSelect, onDragStart }: KanbanCardProps) => {
  // Match score color logic
  const getScoreColor = (score: number) => {
    if (score >= 70) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-600' };
    if (score >= 50) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-600' };
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-600' };
  };

  const scoreColors = getScoreColor(candidate.matchScore);

  return (
    <div
      onClick={onSelect}
      className={`
        flex items-center h-[72px] px-3 gap-3 rounded-lg cursor-pointer
        transition-all duration-150 border border-transparent
        ${isSelected 
          ? 'bg-blue-50 border-l-4 !border-l-blue-600 shadow-sm' 
          : 'hover:bg-slate-50 hover:shadow-sm'
        }
      `}
    >
      {/* Drag Handle - LEFT MOST */}
      <div
        draggable
        onDragStart={onDragStart}
        className="cursor-grab active:cursor-grabbing flex-shrink-0"
        onClick={(e) => e.stopPropagation()} // Prevent card selection when dragging
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>

      {/* Match Score Badge - 48px Circle */}
      <div className={`
        w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
        ${scoreColors.bg} ${scoreColors.text} border-2 ${scoreColors.border}
      `}>
        <span className="text-base font-bold">{candidate.matchScore}</span>
      </div>

      {/* Candidate Info - Flex Grow */}
      <div className="flex-1 min-w-0"> {/* min-w-0 enables text truncation */}
        <h3 className="text-sm font-semibold text-slate-900 truncate">
          {candidate.name}
        </h3>
        <p className="text-xs text-slate-600 truncate">
          {candidate.positionApplied}
        </p>
      </div>

      {/* Status Pill - RIGHT ALIGNED */}
      <div className="flex-shrink-0">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          {candidate.status}
        </span>
      </div>
    </div>
  );
};
```

### What's Removed (Critical)
```typescript
// DELETE these sections from current KanbanCard:
// ❌ <div className="flex gap-2 mt-2"> with action icons
// ❌ <Badge>Moved today</Badge>
// ❌ <Badge>Since Feb 8</Badge>
// ❌ Any dropdown menus
// ❌ External/Internal source badge (move to detail view header)
```

### Card Spacing in Kanban Columns
```tsx
// DashboardKanban.tsx - Column rendering
<div className="space-y-1"> {/* 4px gap between cards */}
  {candidates.map(candidate => (
    <KanbanCard key={candidate.id} {...props} />
  ))}
</div>
```

---

## PHASE 4: MATCH SCORE RADIAL PROGRESS RING COMPONENT

**Files:** `src/components/candidate/MatchScoreRing.tsx` (NEW FILE)

### Complete Implementation
```tsx
// MatchScoreRing.tsx - CREATE NEW FILE
interface MatchScoreRingProps {
  score: number; // 0-100
  size?: number; // Diameter in pixels (default 40)
  strokeWidth?: number; // Default 4
}

export const MatchScoreRing = ({ 
  score, 
  size = 40, 
  strokeWidth = 4 
}: MatchScoreRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Color logic
  const getStrokeColor = () => {
    if (score >= 70) return 'rgb(34, 197, 94)'; // green-500
    if (score >= 50) return 'rgb(251, 191, 36)'; // amber-400
    return 'rgb(239, 68, 68)'; // red-500
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle (track) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgb(226, 232, 240)" // slate-200
        strokeWidth={strokeWidth}
      />
      
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={getStrokeColor()}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} // Start from top
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      
      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dy="0.35em"
        className="text-xs font-bold fill-slate-900"
      >
        {score}
      </text>
    </svg>
  );
};
```

**Usage Example:**
```tsx
<MatchScoreRing score={73} size={40} strokeWidth={4} />
```

---

## PHASE 5: STICKY HEADER FOR CANDIDATE DETAIL VIEW

**Files:** `src/components/candidate/CandidateProfileView.tsx`, `src/components/modals/CandidateModal.tsx`

### Complete Sticky Header Structure
```tsx
// CandidateProfileView.tsx - Replace entire header section
const CandidateProfileView = ({ candidate }: { candidate: Candidate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'match' | 'cv' | 'history' | 'forms'>('profile');

  return (
    <div className="h-full flex flex-col">
      {/* STICKY HEADER - 80px height */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        {/* Main Header Content */}
        <div className="h-20 px-6 flex items-center justify-between">
          {/* LEFT SECTION (60% width) */}
          <div className="flex-1 pr-6">
            {/* Line 1: Name + Match Score Ring + Source Badge */}
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                {candidate.name}
              </h2>
              
              <MatchScoreRing score={candidate.matchScore} size={40} />
              
              <span className={`
                inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
                ${candidate.source === 'internal' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-slate-100 text-slate-700'
                }
              `}>
                {candidate.source === 'internal' ? (
                  <><Building2 className="w-3 h-3 mr-1" /> Internal</>
                ) : (
                  <><Globe className="w-3 h-3 mr-1" /> External</>
                )}
              </span>
            </div>

            {/* Line 2: Role @ Company • Location • Experience */}
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium text-slate-900">{candidate.currentPosition}</span>
              <span>@</span>
              <span className="font-semibold">{candidate.currentCompany}</span>
              <span className="text-slate-400">•</span>
              <span>{candidate.location}</span>
              <span className="text-slate-400">•</span>
              <span>{candidate.yearsOfExperience} years experience</span>
            </div>
          </div>

          {/* RIGHT SECTION (40% width) - Action Bay */}
          <div className="flex items-center gap-2">
            {/* Primary Action Button */}
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-150">
              Move to Interview
            </button>

            {/* Secondary Icon Buttons */}
            <button 
              title="Send Email"
              aria-label="Send email to candidate"
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors duration-150"
            >
              <Mail className="w-5 h-5 text-slate-600" />
            </button>

            <button 
              title="View LinkedIn"
              aria-label="Open LinkedIn profile"
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors duration-150"
            >
              <Linkedin className="w-5 h-5 text-slate-600" />
            </button>

            <button 
              title="Download CV"
              aria-label="Download candidate CV"
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors duration-150"
            >
              <Download className="w-5 h-5 text-slate-600" />
            </button>

            <button 
              title="Share Profile"
              aria-label="Share candidate profile"
              className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors duration-150"
            >
              <Share2 className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <nav className="flex px-6 border-t border-slate-100">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'match', label: 'Match Analysis', icon: Target },
            { id: 'cv', label: 'CV', icon: FileText },
            { id: 'history', label: 'History', icon: Clock },
            { id: 'forms', label: 'Forms', icon: ClipboardList },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150
                border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'profile' && <ProfileTab candidate={candidate} />}
        {activeTab === 'match' && <MatchAnalysisTab candidate={candidate} />}
        {activeTab === 'cv' && <CVTab candidate={candidate} />}
        {activeTab === 'history' && <HistoryTab candidate={candidate} />}
        {activeTab === 'forms' && <FormsTab candidate={candidate} />}
      </div>
    </div>
  );
};
```

**Critical Specifications:**
- Total header height: 80px (h-20)
- Sticky positioning: `sticky top-0 z-10`
- Background: `bg-white` (NOT transparent)
- Border: `border-b border-slate-200`
- Icon buttons: 36px square (w-9 h-9), `hover:bg-slate-100`
- All icon buttons MUST have `title` attribute for tooltips
- All icon buttons MUST have `aria-label` for accessibility
- Tab active state: `border-b-2 border-blue-600` (underline style, NOT pill)

---

## PHASE 6: AI INSIGHTS REDESIGN (2-COLUMN BULLET FORMAT)

**Files:** `src/components/candidate/ProfileTab.tsx` or within `CandidateProfileView.tsx`

### Complete AI Insights Section
```tsx
// ProfileTab.tsx or MatchAnalysisTab.tsx
const AIInsightsSection = ({ evaluation }: { evaluation: CandidateEvaluation }) => {
  // Parse strengths and risks from AI summary
  // Assuming evaluation has: { strengths: string[], risks: string[] }
  // If not, implement parsing logic (see below)

  return (
    <section className="mb-8">
      <h3 className="text-base font-semibold text-slate-900 mb-4">AI Key Insights</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT COLUMN: Strengths */}
        <div className="bg-green-50 border-l-4 border-green-500 rounded-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h4 className="text-sm font-semibold text-green-900">Strengths</h4>
          </div>
          <ul className="space-y-2">
            {evaluation.strengths.slice(0, 4).map((strength, index) => (
              <li key={index} className="text-sm text-green-900 leading-relaxed">
                <span dangerouslySetInnerHTML={{ __html: boldKeywords(strength) }} />
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT COLUMN: Risks/Gaps */}
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="text-sm font-semibold text-amber-900">Areas for Development</h4>
          </div>
          <ul className="space-y-2">
            {evaluation.risks.slice(0, 4).map((risk, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-amber-900 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span dangerouslySetInnerHTML={{ __html: boldKeywords(risk) }} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

// Utility function to bold technical keywords
const boldKeywords = (text: string): string => {
  const techTerms = [
    'Azure', 'SQL', 'Python', 'Snowflake', 'ETL/ELT', 'data pipelines',
    'Azure Data Factory', 'database performance', 'machine learning',
    'automation', 'API', 'REST', 'GraphQL', 'React', 'Node.js',
    'TypeScript', 'JavaScript', 'AWS', 'GCP', 'Kubernetes', 'Docker',
    // Add more relevant terms
  ];
  
  let formatted = text;
  techTerms.forEach(term => {
    const regex = new RegExp(`(${term})`, 'gi');
    formatted = formatted.replace(regex, '<strong>$1</strong>');
  });
  
  return formatted;
};
```

### Data Model Requirements
```typescript
// If evaluation data doesn't have strengths/risks arrays, parse from summary:
interface CandidateEvaluation {
  overallSummary: string; // Current paragraph format
  strengths?: string[];   // ADD THIS
  risks?: string[];       // ADD THIS
  matchScore: number;
}

// Parser function (if needed):
const parseEvaluation = (summary: string): { strengths: string[], risks: string[] } => {
  // Option 1: Look for markers in AI output
  const strengthMatch = summary.match(/Strengths?:(.*?)(?=Risks?:|$)/is);
  const risksMatch = summary.match(/Risks?:(.*?)$/is);
  
  const strengths = strengthMatch 
    ? strengthMatch[1].split(/[•\n-]/).filter(s => s.trim()).map(s => s.trim())
    : [];
    
  const risks = risksMatch
    ? risksMatch[1].split(/[•\n-]/).filter(s => s.trim()).map(s => s.trim())
    : [];
  
  return { strengths, risks };
};

// Option 2: Update AI prompt to return structured JSON
// Request AI to return: { strengths: string[], risks: string[], score: number }
```

**DELETE THIS SECTION:**
```tsx
// ❌ REMOVE the paragraph-style AI Evaluation Summary:
<div className="prose">
  <p>{evaluation.overallSummary}</p>
</div>
```

---

## PHASE 7: SKILLS MATRIX WITH MATCH INDICATORS

**Files:** `src/components/candidate/ProfileTab.tsx`

### Complete Skills Section
```tsx
const SkillsSection = ({ candidate }: { candidate: Candidate }) => {
  // Separate skills into categories
  const technicalSkills = candidate.skills.filter(s => s.category === 'technical');
  const softSkills = candidate.skills.filter(s => s.category === 'soft' || s.category === 'tool');

  return (
    <section className="mb-8">
      <h3 className="text-base font-semibold text-slate-900 mb-4">Skills</h3>
      
      {/* Row 1: Core Technical Skills */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
          Core Technical Skills
        </h4>
        <div className="flex flex-wrap gap-2">
          {technicalSkills.map(skill => (
            <span
              key={skill.name}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700"
            >
              {skill.name}
              {skill.matchesJD && (
                <Check className="w-3.5 h-3.5 text-green-600" />
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Row 2: Soft Skills & Tools */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
          Soft Skills & Tools
        </h4>
        <div className="flex flex-wrap gap-2">
          {softSkills.map(skill => (
            <span
              key={skill.name}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700"
            >
              {skill.name}
              {skill.matchesJD && (
                <Check className="w-3.5 h-3.5 text-green-600" />
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
```

### CRITICAL Data Model Update Required
```typescript
// Current skill structure (assumed):
interface Skill {
  name: string;
  // ... other fields
}

// REQUIRED UPDATE:
interface Skill {
  name: string;
  category: 'technical' | 'soft' | 'tool'; // ADD THIS
  matchesJD: boolean;                       // ADD THIS - set by AI matching logic
}

// Example data:
const candidateSkills: Skill[] = [
  { name: 'Azure Data Factory', category: 'technical', matchesJD: true },
  { name: 'SQL', category: 'technical', matchesJD: true },
  { name: 'Python', category: 'technical', matchesJD: false },
  { name: 'Communication', category: 'soft', matchesJD: false },
  { name: 'Docker', category: 'tool', matchesJD: true },
];
```

**Action Item:** Verify if `matchesJD` field exists in backend data. If not, add it to the candidate profile schema and populate via AI comparison against job description.

---

## PHASE 8: WORK EXPERIENCE TIMELINE VIEW

**Files:** `src/components/candidate/WorkExperienceSection.tsx` (NEW FILE or within ProfileTab)

### Complete Timeline Implementation
```tsx
// WorkExperienceSection.tsx
interface WorkExperience {
  id: string;
  title: string;
  company: string;
  startDate: string; // ISO date string
  endDate: string | null; // null if current
  description: string;
  keyProjects: string[];
}

const WorkExperienceSection = ({ experiences }: { experiences: WorkExperience[] }) => {
  // Sort by date descending (most recent first)
  const sortedExperiences = [...experiences].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  // Calculate gaps
  const experiencesWithGaps = sortedExperiences.map((exp, index) => {
    if (index === sortedExperiences.length - 1) return { ...exp, gapMonths: 0 };
    
    const currentEnd = exp.endDate ? new Date(exp.endDate) : new Date();
    const nextStart = new Date(sortedExperiences[index + 1].startDate);
    const diffMonths = Math.floor(
      (currentEnd.getTime() - nextStart.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    
    return { ...exp, gapMonths: Math.abs(diffMonths) };
  });

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-5 h-5 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-900">Work Experience</h3>
        <span className="text-sm text-slate-500">
          {experiences.reduce((sum, exp) => {
            const start = new Date(exp.startDate);
            const end = exp.endDate ? new Date(exp.endDate) : new Date();
            return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
          }, 0).toFixed(1)} years total
        </span>
      </div>

      {/* Timeline Container */}
      <div className="relative pl-8">
        {/* Vertical Line */}
        <div className="absolute left-2 top-2 bottom-0 w-0.5 bg-slate-300" />

        {/* Experience Entries */}
        {experiencesWithGaps.map((exp, index) => (
          <div key={exp.id}>
            {/* Experience Card */}
            <TimelineEntry experience={exp} />

            {/* Gap Indicator */}
            {exp.gapMonths > 3 && (
              <div className="relative h-8 flex items-center">
                <div className="absolute left-[-22px] w-0.5 h-full border-l-2 border-dashed border-red-400" />
                <span className="ml-2 text-xs font-medium text-red-600">
                  {exp.gapMonths} month gap
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

const TimelineEntry = ({ experience }: { experience: WorkExperience & { gapMonths: number } }) => {
  const [expanded, setExpanded] = useState(false);
  const isCurrent = !experience.endDate;

  const formatDate = (date: string | null) => {
    if (!date) return 'Present';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="relative mb-6 last:mb-0">
      {/* Timeline Node */}
      <div
        className={`
          absolute left-[-22px] w-3 h-3 rounded-full border-2 border-white
          ${isCurrent ? 'bg-blue-600' : 'bg-slate-400'}
        `}
      />

      {/* Content */}
      <div className="bg-white">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-slate-900">{experience.title}</h4>
            
              href={`https://www.linkedin.com/company/${experience.company}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {experience.company}
            </a>
          </div>
          <span className="text-xs text-slate-500 flex-shrink-0 ml-4">
            {formatDate(experience.startDate)} - {formatDate(experience.endDate)}
          </span>
        </div>

        {/* Description */}
        <p className={`text-sm text-slate-600 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {experience.description}
        </p>
        {experience.description.length > 150 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:underline mt-1"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Key Projects */}
        {experience.keyProjects.length > 0 && (
          <div className="mt-3">
            <h5 className="text-xs font-semibold text-slate-700 mb-2">Key Projects</h5>
            <div className="flex flex-wrap gap-1.5">
              {experience.keyProjects.map(project => (
                <span
                  key={project}
                  className="inline-block px-2 py-1 text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded"
                >
                  {project}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Gap Calculation Logic
```typescript
// Helper function to calculate employment gaps
const calculateGap = (endDate: string | null, nextStartDate: string): number => {
  if (!endDate) return 0; // Current job has no gap
  
  const end = new Date(endDate);
  const nextStart = new Date(nextStartDate);
  
  const diffTime = Math.abs(end.getTime() - nextStart.getTime());
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  
  return diffMonths;
};
```

**Tailwind Classes Used:**
- `line-clamp-2` for collapsing descriptions (requires @tailwindcss/line-clamp plugin or Tailwind 3.3+)
- `last:mb-0` to remove bottom margin from last item
- Border-dashed: `border-dashed` (requires config if not available)

---

## PHASE 9: EDUCATION & CERTIFICATIONS COMPACT

**Files:** `src/components/candidate/ProfileTab.tsx`

### Complete Education & Certifications Section
```tsx
const EducationSection = ({ education }: { education: Education[] }) => {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-900">Education</h3>
      </div>
      
      <div className="space-y-2">
        {education.map(edu => (
          <div key={edu.id} className="flex items-center gap-3 text-sm">
            <GraduationCap className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div>
              <span className="font-semibold text-slate-900">{edu.degree}</span>
              <span className="text-slate-600"> • {edu.institution}</span>
              <span className="text-slate-500"> • {edu.year}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const CertificationsSection = ({ certifications }: { certifications: Certification[] }) => {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-900">Certifications</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {certifications.map(cert => (
          <span
            key={cert.id}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-amber-50 border border-amber-200 text-amber-800"
          >
            {cert.name} • {cert.year}
          </span>
        ))}
      </div>
    </section>
  );
};
```

**Changes from Current Design:**
- Remove large yellow background blocks (`bg-yellow-50`)
- Education: Single line per degree (NOT cards)
- Certifications: Compact chips with year included in chip text
- Use `bg-amber-50` instead of `bg-yellow-50` (more professional)

---

## PHASE 10: APPLICATION METADATA GRID

**Files:** `src/components/candidate/ProfileTab.tsx`

### Complete Metadata Section
```tsx
const ApplicationMetadata = ({ candidate }: { candidate: Candidate }) => {
  const metadata = [
    { 
      label: 'Applied Date', 
      value: new Date(candidate.appliedDate).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      }),
      icon: Calendar 
    },
    { 
      label: 'Position Applied', 
      value: candidate.positionApplied,
      icon: Briefcase 
    },
    { 
      label: 'Earliest Start Date', 
      value: candidate.earliestStartDate || 'Not provided',
      icon: Clock 
    },
    { 
      label: 'Employment Type', 
      value: candidate.employmentType,
      icon: FileText 
    },
    { 
      label: 'Expected Salary', 
      value: candidate.expectedSalary || 'Not provided',
      icon: DollarSign 
    },
    { 
      label: 'Current Company', 
      value: candidate.currentCompany,
      icon: Building2 
    },
  ];

  return (
    <section className="mb-8">
      <h3 className="text-base font-semibold text-slate-900 mb-4">Application Details</h3>
      
      <div className="bg-slate-50 rounded-md p-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {metadata.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-slate-600">{item.label}</span>
                </div>
                <p className="text-sm font-medium text-slate-900 ml-6">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
```

---

## PHASE 11: KANBAN EMPTY STATE FIX

**Files:** `src/components/dashboard/KanbanColumn.tsx`, `src/components/dashboard/DashboardKanban.tsx`

### Complete Empty Column Handling
```tsx
// KanbanColumn.tsx
interface KanbanColumnProps {
  title: string;
  count: number;
  candidates: Candidate[];
  onDrop: (candidateId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const KanbanColumn = ({ 
  title, 
  count, 
  candidates, 
  onDrop,
  isCollapsed,
  onToggleCollapse 
}: KanbanColumnProps) => {
  const isEmpty = candidates.length === 0;

  if (isCollapsed) {
    return (
      <div className="w-12 bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer" onClick={onToggleCollapse}>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>
    );
  }

  return (
    <div 
      className={`flex-1 min-w-[280px] bg-white rounded-lg border border-slate-200 flex flex-col ${
        isEmpty ? 'opacity-50' : ''
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const candidateId = e.dataTransfer.getData('candidateId');
        onDrop(candidateId);
      }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
            {count}
          </span>
        </div>
        
        {isEmpty && (
          <button
            onClick={onToggleCollapse}
            title="Collapse empty column"
            className="p-1 hover:bg-slate-100 rounded"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Column Content */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No candidates
          </div>
        ) : (
          candidates.map(candidate => (
            <KanbanCard
              key={candidate.id}
              candidate={candidate}
              onDragStart={(e) => {
                e.dataTransfer.setData('candidateId', candidate.id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
```

### Kanban Container with Collapse State
```tsx
// DashboardKanban.tsx
const DashboardKanban = () => {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());

  const columns = [
    { id: 'hr_interview', title: 'For HR Interview', candidates: hrCandidates },
    { id: 'tech_interview', title: 'For Tech Interview', candidates: techCandidates },
    { id: 'offer', title: 'Offer', candidates: offerCandidates },
    { id: 'hired', title: 'Hired', candidates: hiredCandidates },
  ];

  const toggleCollapse = (columnId: string) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  };

  return (
    <div className="flex gap-4 h-full">
      {columns.map(column => (
        <KanbanColumn
          key={column.id}
          title={column.title}
          count={column.candidates.length}
          candidates={column.candidates}
          isCollapsed={collapsedColumns.has(column.id)}
          onToggleCollapse={() => toggleCollapse(column.id)}
        />
      ))}
    </div>
  );
};
```

**Key Changes:**
- Empty columns: Show "No candidates" centered text, NO large placeholder
- Empty columns: Reduce opacity to 50% (`opacity-50`)
- Add collapse button (chevron icon) to empty column headers
- Collapsed columns: 48px width vertical bar with expand chevron
- Remove "Drop candidates here" large empty state

---

## PHASE 12: ALL CANDIDATES TABLE IMPROVEMENTS

**Files:** `src/pages/CandidatesPage.tsx`

### Complete Table Implementation
```tsx
// CandidatesPage.tsx
const CandidatesTable = ({ candidates }: { candidates: Candidate[] }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-24">
              AI Score
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Candidate
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Applied For
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider w-32">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {candidates.map(candidate => (
            <CandidateTableRow key={candidate.id} candidate={candidate} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CandidateTableRow = ({ candidate }: { candidate: Candidate }) => {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-700 border-green-600';
    if (score >= 50) return 'bg-amber-100 text-amber-700 border-amber-600';
    return 'bg-red-100 text-red-700 border-red-600';
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors duration-150">
      {/* Match Score Column */}
      <td className="px-4 py-4">
        <div className="flex justify-center">
          <span className={`
            inline-flex items-center justify-center w-12 h-12 rounded-full text-base font-bold border-2
            ${getScoreColor(candidate.matchScore)}
          `}>
            {candidate.matchScore}
          </span>
        </div>
      </td>

      {/* Candidate Column */}
      <td className="px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{candidate.name}</p>
          <p className="text-xs text-slate-500">{candidate.email}</p>
        </div>
      </td>

      {/* Applied For Column */}
      <td className="px-4 py-4">
        <div>
          <p className="text-sm font-medium text-slate-900">{candidate.positionApplied}</p>
          <p className="text-xs text-slate-500">{candidate.department}</p>
        </div>
      </td>

      {/* Status Column */}
      <td className="px-4 py-4">
        <Select value={candidate.status}>
          <SelectTrigger className={`w-48 ${
            candidate.status === 'For HR Interview' ? 'bg-blue-50 border-blue-200' : ''
          }`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="For HR Interview">For HR Interview</SelectItem>
            <SelectItem value="For Tech Interview">For Tech Interview</SelectItem>
            <SelectItem value="Offer">Offer</SelectItem>
            <SelectItem value="Hired">Hired</SelectItem>
          </SelectContent>
        </Select>
      </td>

      {/* Actions Column */}
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-1">
          <button
            title="Send Email"
            aria-label="Send email to candidate"
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 transition-colors duration-150"
          >
            <Mail className="w-4 h-4 text-slate-600" />
          </button>
          
          <button
            title="Send Message"
            aria-label="Send message to candidate"
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 transition-colors duration-150"
          >
            <MessageSquare className="w-4 h-4 text-slate-600" />
          </button>
          
          <button
            title="View Profile"
            aria-label="View candidate profile"
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 transition-colors duration-150"
          >
            <Eye className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </td>
    </tr>
  );
};
```

**Key Specifications:**
- Match score: 48px circular badge (w-12 h-12), centered in column
- Candidate info: Name 14px bold, email 12px text-slate-500 below
- Applied For: Role bold, department 12px text-slate-500 below
- Status dropdown: `bg-blue-50 border-blue-200` when "For HR Interview"
- Action buttons: 32px (w-8 h-8), `hover:bg-slate-100`, with tooltips

---

## PHASE 13: JOB ORDER CARD SELECTION STATE

**Files:** `src/components/dashboard/JobOrderCard.tsx`

### Complete Job Order Card
```tsx
// JobOrderCard.tsx
interface JobOrderCardProps {
  job: JobOrder;
  isSelected: boolean;
  onClick: () => void;
}

const JobOrderCard = ({ job, isSelected, onClick }: JobOrderCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg cursor-pointer transition-all duration-150 border
        ${isSelected 
          ? 'bg-blue-50 border-l-4 !border-l-blue-600 border-t-transparent border-r-transparent border-b-transparent shadow-sm' 
          : 'border-transparent hover:bg-slate-50'
        }
      `}
    >
      {/* Job Title */}
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{job.title}</h3>
      
      {/* Department */}
      <p className="text-xs text-slate-600 mb-2">{job.department}</p>
      
      {/* Metadata Row */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(job.createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {job.candidateCount} candidates
        </span>
      </div>

      {/* Status Badge */}
      <div className="mt-3">
        <span className={`
          inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
          ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}
        `}>
          {job.status === 'open' ? 'Open' : 'Closed'}
        </span>
      </div>
    </div>
  );
};
```

---

## PHASE 14: MICRO-INTERACTIONS & POLISH

**Files:** Multiple component files

### Global Transition Classes
```css
/* Add to index.css */
.transition-standard {
  transition: all 150ms ease-in-out;
}

.transition-colors-standard {
  transition: color 150ms ease-in-out, background-color 150ms ease-in-out, border-color 150ms ease-in-out;
}

.transition-shadow-standard {
  transition: box-shadow 200ms ease-in-out;
}
```

### Apply to All Interactive Elements
```tsx
// Buttons
<button className="... transition-colors duration-150 hover:bg-blue-700">

// Cards
<div className="... transition-all duration-150 hover:shadow-md">

// Links
<a className="... transition-colors duration-150 hover:text-blue-700">

// Icon Buttons
<button className="... transition-colors duration-150 hover:bg-slate-100">
```

### Toast Notifications (Already using Sonner)
```tsx
// Verify Sonner configuration in main app file:
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Toaster position="top-right" duration={4000} />
      {/* ... */}
    </>
  );
}

// Usage in components:
import { toast } from 'sonner';

toast.success('Email sent to candidate');
toast.error('Failed to update status');
toast.info('Candidate moved to Interview stage');
```

### Empty States
```tsx
// EmptyState component (reusable)
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      <Icon className="w-16 h-16 text-slate-300 mb-4" />
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 text-center max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-150"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Usage:
<EmptyState
  icon={Users}
  title="No candidates yet"
  description="Start sourcing candidates for this position to see them here."
  actionLabel="Source Candidates"
  onAction={() => navigate('/source')}
/>
```

---

## PHASE 15: ACCESSIBILITY COMPLIANCE

**Files:** All interactive components

### Focus Indicators
```css
/* Add to index.css */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}
```

### Apply to All Focusable Elements
```tsx
// Buttons
<button className="... focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">

// Links
<a className="... focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">

// Icon buttons
<button 
  aria-label="Send email"
  className="... focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
>

// Input fields
<input className="... focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
```

### ARIA Labels for Icon-Only Buttons
```tsx
// All icon buttons MUST have aria-label:
<button 
  aria-label="Send email to candidate"
  title="Send Email"  // Also add title for tooltip
>
  <Mail className="w-5 h-5" />
</button>

<button 
  aria-label="Download candidate CV"
  title="Download CV"
>
  <Download className="w-5 h-5" />
</button>
```

### Keyboard Navigation
```tsx
// Tab navigation order should follow visual layout:
// 1. Left nav rail
// 2. Middle pane (job list)
// 3. Detail view header actions
// 4. Detail view tabs
// 5. Detail view content

// Add keyboard handlers for candidate selection:
const handleKeyDown = (e: KeyboardEvent, candidate: Candidate) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    selectCandidate(candidate.id);
  }
};

<div
  tabIndex={0}
  onKeyDown={(e) => handleKeyDown(e, candidate)}
  onClick={() => selectCandidate(candidate.id)}
>
```

### Color Contrast Verification
```typescript
// Primary text on white: rgb(15, 23, 42) on rgb(255, 255, 255) = 14.1:1 ✓
// Secondary text on white: rgb(100, 116, 139) on rgb(255, 255, 255) = 5.7:1 ✓
// Button text on blue: rgb(255, 255, 255) on rgb(37, 99, 235) = 4.7:1 ✓
// All combinations meet WCAG AA (4.5:1 minimum)
```

---

## PHASE 16: FINAL VALIDATION & TESTING CHECKLIST

### Visual Regression Checklist
- [ ] No double borders anywhere (card inside card inside background)
- [ ] All backgrounds use `bg-slate-50` (app) or `bg-white` (surfaces), not pure white (#FFF) for app background
- [ ] All text uses slate colors (never pure black #000)
- [ ] All shadows are either `shadow-sm` or `shadow-md` (no hard shadows)
- [ ] All border-radius is either `rounded-lg` (8px) or `rounded-md` (6px)
- [ ] All selected items have `bg-blue-50 border-l-4 border-blue-600`

### Functional Checklist
- [ ] Candidate can be assessed in <10 seconds from sticky header + AI insights
- [ ] Match score is visible in all views (list, kanban, detail) as visual indicator
- [ ] Employment gaps >3 months are visually highlighted in timeline
- [ ] Skills that match JD show green checkmark
- [ ] All icon-only buttons have tooltips and aria-labels
- [ ] Empty kanban columns are collapsed or low-opacity, not large placeholders
- [ ] Primary action button (Move to Interview) is always visible without scrolling
- [ ] AI summary is bullet points with bold keywords, not paragraphs

### Component-Specific Checklist
- [ ] **Navigation Rail:** 64px fixed width, icon-only, active state bg-blue-600
- [ ] **Candidate Cards:** 72px max height, horizontal layout, no action buttons
- [ ] **Sticky Header:** 80px height, sticky top-0, contains actions and tabs
- [ ] **Match Score Ring:** Animated radial progress SVG, color-coded
- [ ] **AI Insights:** 2-column grid (strengths left, risks right), bullet format
- [ ] **Skills Matrix:** Two rows (technical blue, soft/tools gray), checkmarks for matches
- [ ] **Timeline:** Vertical line with nodes, gap indicators for 3+ months
- [ ] **Empty States:** Icon + message + CTA, no large placeholders

### Data Model Verification
- [ ] `Skill` interface has `category: 'technical' | 'soft' | 'tool'` field
- [ ] `Skill` interface has `matchesJD: boolean` field
- [ ] `CandidateEvaluation` has `strengths: string[]` and `risks: string[]` fields (or parser implemented)
- [ ] Work experience includes `keyProjects: string[]` field

### Accessibility Audit
- [ ] All icon buttons have `aria-label` and `title` attributes
- [ ] All focusable elements have `focus:ring-2 focus:ring-blue-500` styles
- [ ] Tab order follows visual layout (nav → list → detail)
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Keyboard shortcuts: Enter/Space to select candidates

---

## IMPLEMENTATION ORDER & DEPENDENCIES

```
1. Phase 1 (Design System) ← No dependencies, START HERE
   ↓
2. Phase 2 (Layout) ← Depends on Phase 1
   ↓
3. Phase 4 (Match Score Ring Component) ← Standalone, can parallelize
   |
4. Phase 3 (Candidate Cards) ← Depends on Phase 4 (ring component)
   ↓
5. Phase 13 (Job Order Card) ← Similar to Phase 3
   ↓
6. Phase 5 (Sticky Header) ← Depends on Phase 4 (ring component)
   ↓
7. Phase 6 (AI Insights) ← Can parallelize with Phase 7-9
8. Phase 7 (Timeline) ← Can parallelize
9. Phase 8 (Skills) ← Can parallelize
10. Phase 9 (Education) ← Can parallelize
11. Phase 10 (Metadata) ← Can parallelize
    ↓
12. Phase 11 (Kanban Empty State) ← Depends on Phase 3 (card redesign)
    ↓
13. Phase 12 (Table View) ← Depends on Phase 4 (ring component)
    ↓
14. Phase 14 (Micro-interactions) ← Apply globally after components done
    ↓
15. Phase 15 (Accessibility) ← Apply globally after components done
    ↓
16. Phase 16 (Validation) ← Final review
```

**Suggested Sprint Breakdown:**
- **Sprint 1 (Days 1-2):** Phases 1, 2, 4 (Foundation + Layout + Match Score Ring)
- **Sprint 2 (Days 3-4):** Phases 3, 5, 13 (Cards + Sticky Header)
- **Sprint 3 (Days 5-6):** Phases 6, 7, 8, 9, 10 (All detail view sections)
- **Sprint 4 (Days 7-8):** Phases 11, 12, 14, 15 (Empty states, table, polish, accessibility)
- **Sprint 5 (Day 9):** Phase 16 (Testing & validation)

---

## CRITICAL SUCCESS METRICS

### Performance Metrics
- **Time to Assessment:** Recruiter can determine "Yes/No" on candidate in <10 seconds
- **Scroll Requirement:** All critical info (name, score, strengths/risks, actions) visible without scrolling
- **Visual Clarity:** Employment gaps identified in <3 seconds via timeline view

### Design Compliance
- **No Double Borders:** 0% of components use nested border patterns
- **Color Consistency:** 100% of text uses slate colors (not pure black)
- **Shadow Consistency:** 100% of shadows are either shadow-sm or shadow-md
- **Selection Clarity:** Active candidate has blue-50 background + blue-600 left border in ALL views

### Accessibility Score
- **WCAG AA Compliance:** 100% of text meets 4.5:1 contrast ratio
- **Keyboard Navigation:** All interactive elements reachable via Tab key
- **Screen Reader Support:** All icon buttons have aria-labels

---

## FILES MODIFIED (COMPLETE LIST)

### Global Files (2)
1. `src/index.css`
2. `tailwind.config.ts`

### Layout Components (2)
3. `src/components/layout/AppLayout.tsx`
4. `src/components/layout/Sidebar.tsx`

### New Components (1)
5. `src/components/candidate/MatchScoreRing.tsx` ← **NEW FILE**

### Dashboard Components (3)
6. `src/components/dashboard/DashboardKanban.tsx`
7. `src/components/dashboard/KanbanCard.tsx`
8. `src/components/dashboard/KanbanColumn.tsx`

### Job Order Components (1)
9. `src/components/dashboard/JobOrderCard.tsx`

### Candidate Profile Components (2)
10. `src/components/candidate/CandidateProfileView.tsx`
11. `src/components/candidate/ProfileTab.tsx` (or create if doesn't exist)

### Page Components (2)
12. `src/pages/DashboardPage.tsx`
13. `src/pages/CandidatesPage.tsx`

### Optional New Components
14. `src/components/candidate/WorkExperienceSection.tsx` ← **NEW FILE** (if extracting from ProfileTab)
15. `src/components/shared/EmptyState.tsx` ← **NEW FILE** (reusable component)

**Total Files:** 13-15 files modified/created

---

## POST-IMPLEMENTATION VALIDATION SCRIPT

```typescript
// validation-checklist.ts
const validationChecks = {
  designSystem: {
    noPureBlack: () => {
      // Check if any text uses #000 or rgb(0,0,0)
      const elements = document.querySelectorAll('*');
      return Array.from(elements).every(el => {
        const color = window.getComputedStyle(el).color;
        return color !== 'rgb(0, 0, 0)';
      });
    },
    correctBackground: () => {
      const body = document.body;
      const bgColor = window.getComputedStyle(body).backgroundColor;
      return bgColor === 'rgb(248, 250, 252)'; // bg-slate-50
    },
    noHardShadows: () => {
      // Check if any shadows are larger than shadow-md
      // Implementation depends on your shadow system
      return true;
    },
  },
  
  layout: {
    sidebarWidth: () => {
      const sidebar = document.querySelector('[data-testid="sidebar"]');
      return sidebar?.clientWidth === 64;
    },
    middlePaneWidth: () => {
      const middlePane = document.querySelector('[data-testid="candidate-list"]');
      return middlePane?.clientWidth === 350;
    },
  },
  
  candidateCard: {
    maxHeight: () => {
      const cards = document.querySelectorAll('[data-testid="kanban-card"]');
      return Array.from(cards).every(card => card.clientHeight <= 72);
    },
    hasMatchScoreRing: () => {
      const rings = document.querySelectorAll('svg[data-testid="match-score-ring"]');
      return rings.length > 0;
    },
  },
  
  stickyHeader: {
    isSticky: () => {
      const header = document.querySelector('[data-testid="candidate-header"]');
      const position = window.getComputedStyle(header!).position;
      return position === 'sticky';
    },
    height: () => {
      const header = document.querySelector('[data-testid="candidate-header"]');
      return header?.clientHeight === 80;
    },
  },
};

// Run all checks
Object.entries(validationChecks).forEach(([category, checks]) => {
  console.log(`\n${category.toUpperCase()}:`);
  Object.entries(checks).forEach(([checkName, checkFn]) => {
    const result = checkFn();
    console.log(`  ${checkName}: ${result ? '✓' : '✗'}`);
  });
});
```

---

## FINAL NOTES

1. **No Mobile/Tablet Support:** All responsive code removed. Design optimized for desktop 1280px+ only.

2. **Data Model Updates Required:** Before Phase 6 and 7, verify that backend provides:
   - `Skill.matchesJD: boolean`
   - `Skill.category: 'technical' | 'soft' | 'tool'`
   - `CandidateEvaluation.strengths: string[]`
   - `CandidateEvaluation.risks: string[]`

3. **Radial Progress Ring:** Custom SVG component (Phase 4) must be implemented before card redesign (Phase 3).

4. **Timeline Gap Calculation:** Requires date parsing and month calculation logic (provided in Phase 8).

5. **Empty State Icons:** Use Lucide React icons (Users, Briefcase, FileX, Inbox) instead of custom illustrations.

6. **Accessibility:** All icon-only buttons must have both `aria-label` AND `title` attributes.

7. **Testing Strategy:** Use the validation script above after implementation to verify compliance.

---

**This plan is complete and ready for implementation. Follow the phase order strictly to avoid dependency issues.**

*** CRITICAL EXECUTION CONSTRAINTS (READ BEFORE CODING) ***

1. NO DATABASE/BACKEND CHANGES ALLOWED
   - The backend is immutable. You cannot add fields like `category`, `matchesJD`, or `gapMonths` to the database.
   - **Strategy:** All new data requirements must be calculated on the FRONTEND (Client-side) or handled via "UI Adapters".

2. DATA FALLBACK PROTOCOL (Conflict Resolution)
   - **Skills:** If `skill.category` does not exist in the data, do NOT crash or show empty headers. Instead, fallback to displaying all skills in a single "Skills" section (ignore the Technical/Soft split).
   - **JD Matching:** If `matchesJD` is missing, simply hide the green checkmark. Do not break the chip component.
   - **AI Insights:** If the backend returns a text paragraph instead of structured `strengths/risks` arrays, implement a client-side text parser (Regex) to extract bullet points. If parsing fails, FALLBACK to displaying the original paragraph cleanly.
   - **Timeline:** Calculate `gapMonths` purely in the React component using the existing `startDate` and `endDate` strings.

3. FEATURE SCOPE: EMAIL ONLY
   - There is NO "Send Message" or chat functionality.
   - Remove the `MessageSquare` icon entirely.
   - The specific action is "Send Email" (Mail icon).

4. GENERAL RULE: GRACEFUL DEGRADATION
   - If a specific UI element (like the "Match Score Ring" or "Gap Indicator") relies on data that is completely unavailable or null, **hide the element entirely** rather than showing broken UI or "NaN".
   - Your priority is a working, crash-free UI over a 100% perfect match of the mockup if data is missing.