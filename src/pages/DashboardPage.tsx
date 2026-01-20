import { useState } from 'react';
import { motion } from 'framer-motion';
import { List, LayoutGrid, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { JobOrderList } from '@/components/dashboard/JobOrderList';
import { JobOrderDetail } from '@/components/dashboard/JobOrderDetail';
import { KanbanBoard } from '@/components/dashboard/KanbanBoard';
import { CandidateListView } from '@/components/dashboard/CandidateListView';

export default function DashboardPage() {
  const { selectedJoId, jobOrders, isVectorized, getMatchesForJo } = useApp();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const selectedJo = jobOrders.find(jo => jo.id === selectedJoId);
  const matches = selectedJoId ? getMatchesForJo(selectedJoId) : [];

  // Filter to show only active JOs (not closed/fulfilled)
  const activeJobOrders = jobOrders.filter(
    jo => jo.status !== 'closed' && jo.status !== 'fulfilled'
  );

  return (
    <div className="h-screen flex">
      {/* Left Pane: JO List */}
      <div className="w-[35%] border-r border-border bg-card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Job Orders
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {activeJobOrders.length} active orders
          </p>
        </div>
        <div className="flex-1 overflow-auto">
          <JobOrderList jobOrders={activeJobOrders} />
        </div>
      </div>

      {/* Right Pane: Detail View */}
      <div className="flex-1 bg-background overflow-hidden flex flex-col">
        {selectedJo ? (
          <>
            {/* Header */}
            <JobOrderDetail jobOrder={selectedJo} matchCount={matches.length} />
            
            {/* View Toggle */}
            <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-card">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {matches.length} Matched Candidates
                </span>
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  className="gap-1.5 h-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                  List
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  className="gap-1.5 h-8"
                  onClick={() => setViewMode('kanban')}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Board
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {!isVectorized ? (
                <EmptyVectorizationState />
              ) : matches.length === 0 ? (
                <EmptyMatchesState />
              ) : viewMode === 'list' ? (
                <CandidateListView candidates={matches} />
              ) : (
                <KanbanBoard candidates={matches} />
              )}
            </div>
          </>
        ) : (
          <EmptySelectionState />
        )}
      </div>
    </div>
  );
}

function EmptySelectionState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Select a Job Order
        </h3>
        <p className="text-muted-foreground text-sm">
          Choose a job order from the list to view matched candidates.
        </p>
      </motion.div>
    </div>
  );
}

function EmptyVectorizationState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center mb-6">
        <Users className="w-10 h-10 text-primary/50" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No Candidates Yet
      </h3>
      <p className="text-muted-foreground max-w-md">
        Upload and vectorize candidate CVs to enable AI-powered matching.
        Go to <span className="text-primary font-medium">CV Ingestion</span> to get started.
      </p>
    </motion.div>
  );
}

function EmptyMatchesState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
        <Users className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No Matches Found
      </h3>
      <p className="text-muted-foreground max-w-md">
        No candidates currently match this job order's requirements.
      </p>
    </motion.div>
  );
}
