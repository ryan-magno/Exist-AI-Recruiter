import { useState } from 'react';
import { motion } from 'framer-motion';
import { List, LayoutGrid, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { JobOrderList } from '@/components/dashboard/JobOrderList';
import { JobOrderDetail } from '@/components/dashboard/JobOrderDetail';
import { KanbanBoard } from '@/components/dashboard/KanbanBoard';
import { CandidateListView } from '@/components/dashboard/CandidateListView';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export default function DashboardPage() {
  const { selectedJoId, jobOrders, isVectorized, getMatchesForJo } = useApp();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const selectedJo = jobOrders.find(jo => jo.id === selectedJoId);
  const matches = selectedJoId ? getMatchesForJo(selectedJoId) : [];

  const activeJobOrders = jobOrders.filter(
    jo => jo.status !== 'closed' && jo.status !== 'fulfilled'
  );

  return (
    <div className="h-screen flex">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Pane: JO List */}
        <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
          <div className="h-full bg-card overflow-hidden flex flex-col">
            <div className="p-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Job Orders</h2>
                <p className="text-xs text-muted-foreground">
                  {activeJobOrders.length} active
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <JobOrderList jobOrders={activeJobOrders} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Pane: Detail View */}
        <ResizablePanel defaultSize={65}>
          <div className="h-full bg-background overflow-hidden flex flex-col">
            {selectedJo ? (
              <>
                <JobOrderDetail jobOrder={selectedJo} matchCount={matches.length} />
                
                <div className="px-4 py-2 border-b border-border flex items-center justify-between bg-card/50">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {matches.length} Matched Candidates
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                    <Button
                      size="sm"
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      className="gap-1 h-7 text-xs"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-3.5 h-3.5" />
                      List
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                      className="gap-1 h-7 text-xs"
                      onClick={() => setViewMode('kanban')}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Board
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function EmptySelectionState() {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Select a Job Order</h3>
        <p className="text-muted-foreground text-sm">Choose a job order from the list to view matched candidates.</p>
      </motion.div>
    </div>
  );
}

function EmptyVectorizationState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No Candidates Yet</h3>
      <p className="text-muted-foreground text-sm max-w-md">
        Upload and vectorize candidate CVs to enable AI-powered matching.
      </p>
    </motion.div>
  );
}

function EmptyMatchesState() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No Matches Found</h3>
      <p className="text-muted-foreground text-sm max-w-md">No candidates currently match this job order's requirements.</p>
    </motion.div>
  );
}
