"use client";

import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronDown,
  Trophy,
  FolderTree,
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowRight,
  FolderOpen,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Dialog from "@/components/ui/Dialog";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import {
  createLeagueNode,
  updateLeagueNode,
  deleteLeagueNode,
} from "@/lib/actions/leagueNode-actions";
import {
  createTeamEnrollment,
  deleteTeamEnrollment,
} from "@/lib/actions/teamEnrollment-actions";

interface LeaguesStructureClientProps {
  leaguesData: { label: string; value: string }[];
  leagueNodesOptionsData: { label: string; value: string }[];
  teamSeasonsData: { label: string; value: string }[];
  seasonsData: { label: string; value: string }[];
  leagueNodesRecords: any[];
  teamEnrollmentsRecords: any[];
  defaultSeasonId?: string;
}

interface TreeNode {
  id: string; // e.g. "league-12" or "node-45"
  type: "league" | "node";
  name: string;
  nodeType?: string;
  leagueId: number;
  nodeId?: number;
  parentId?: number | null;
  children: TreeNode[];
  record?: any;
}

export default function LeaguesStructureClient({
  leaguesData,
  leagueNodesOptionsData,
  teamSeasonsData,
  seasonsData,
  leagueNodesRecords,
  teamEnrollmentsRecords,
  defaultSeasonId,
}: LeaguesStructureClientProps) {
  const router = useRouter();

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(
    defaultSeasonId || seasonsData[0]?.value || "",
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Dialog & Modal states
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [addParentItem, setAddParentItem] = useState<{
    id: string;
    name: string;
    type: "league" | "node";
    leagueId: number;
    nodeId?: number;
  } | null>(null);

  const [isEditNodeOpen, setIsEditNodeOpen] = useState(false);
  const [editItem, setEditItem] = useState<{
    id: number;
    name: string;
    nodeType: string;
    level: number;
    displayOrder: number;
  } | null>(null);

  const [isDeleteNodeOpen, setIsDeleteNodeOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Form states
  const [nodeFormName, setNodeFormName] = useState("");
  const [nodeFormType, setNodeFormType] = useState("conference");
  const [nodeFormLevel, setNodeFormLevel] = useState("0");
  const [nodeFormOrder, setNodeFormOrder] = useState("0");
  const [nodeFormParentId, setNodeFormParentId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [enrollFormTeamSeasonId, setEnrollFormTeamSeasonId] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Build the hierarchical tree of leagues and nodes
  const fullTree = useMemo(() => {
    const nodeMap: Record<number, TreeNode> = {};

    // 1. Initialize nodes map
    leagueNodesRecords.forEach((n) => {
      nodeMap[n.id] = {
        id: `node-${n.id}`,
        type: "node",
        name: n.name,
        nodeType: n.nodeType,
        leagueId: n.leagueId,
        nodeId: n.id,
        parentId: n.parentId,
        children: [],
        record: n,
      };
    });

    // 2. Map of root nodes by leagueId
    const rootsByLeague: Record<number, TreeNode[]> = {};
    leaguesData.forEach((l) => {
      rootsByLeague[Number(l.value)] = [];
    });

    // 3. Populate relationships
    leagueNodesRecords.forEach((n) => {
      const treeNode = nodeMap[n.id];
      if (n.parentId && nodeMap[n.parentId]) {
        nodeMap[n.parentId].children.push(treeNode);
      } else {
        if (rootsByLeague[n.leagueId]) {
          rootsByLeague[n.leagueId].push(treeNode);
        }
      }
    });

    // 4. Construct root tree nodes (Leagues)
    const tree: TreeNode[] = leaguesData.map((l) => ({
      id: `league-${l.value}`,
      type: "league",
      name: l.label,
      leagueId: Number(l.value),
      children: rootsByLeague[Number(l.value)] || [],
    }));

    return tree;
  }, [leaguesData, leagueNodesRecords]);

  // Expand all root keys by default on mount
  useEffect(() => {
    const initialKeys: Record<string, boolean> = {};
    leaguesData.forEach((l) => {
      initialKeys[`league-${l.value}`] = true;
    });
    setExpandedKeys(initialKeys);
  }, [leaguesData]);

  // Filter tree based on search query
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return fullTree;

    const query = searchQuery.toLowerCase();
    const newExpandedKeys = { ...expandedKeys };

    const checkNodeMatch = (node: TreeNode): boolean => {
      const selfMatches =
        node.name.toLowerCase().includes(query) ||
        (node.nodeType && node.nodeType.toLowerCase().includes(query));

      let anyChildMatches = false;
      node.children.forEach((c) => {
        if (checkNodeMatch(c)) {
          anyChildMatches = true;
        }
      });

      // If this season has any matching enrolled teams under this node
      const nodeTeams =
        node.type === "node"
          ? teamEnrollmentsRecords.filter(
              (e) =>
                e.leagueNodeId === node.nodeId &&
                e.seasonId === Number(selectedSeasonId),
            )
          : [];
      const teamMatches = nodeTeams.some(
        (t) =>
          t.teamName.toLowerCase().includes(query) ||
          t.clubName.toLowerCase().includes(query),
      );

      const matches = selfMatches || anyChildMatches || teamMatches;
      if (matches) {
        newExpandedKeys[node.id] = true;
      }
      return matches;
    };

    const filtered = fullTree.filter((l) => checkNodeMatch(l));

    // Delay updating expandedKeys state to avoid re-renders during render phase
    setTimeout(() => {
      setExpandedKeys((prev) => ({ ...prev, ...newExpandedKeys }));
    }, 0);

    return filtered;
  }, [fullTree, searchQuery, teamEnrollmentsRecords, selectedSeasonId]);

  // Helper to toggle node expansion
  const toggleExpand = (id: string) => {
    setExpandedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to get breadcrumb trail
  const getBreadcrumbs = (nodeId: number) => {
    const path: string[] = [];
    let curr = leagueNodesRecords.find((n) => n.id === nodeId);
    while (curr) {
      path.unshift(curr.name);
      if (curr.parentId) {
        curr = leagueNodesRecords.find((n) => n.id === curr.parentId);
      } else {
        const l = leaguesData.find((lg) => Number(lg.value) === curr.leagueId);
        if (l) path.unshift(l.label);
        break;
      }
    }
    return path;
  };

  // ─── Selection Resolutions ──────────────────────────────────────────────────
  const selectedInfo = useMemo(() => {
    if (!selectedItemId) return null;

    if (selectedItemId.startsWith("league-")) {
      const leagueId = Number(selectedItemId.replace("league-", ""));
      const league = leaguesData.find((l) => Number(l.value) === leagueId);
      if (!league) return null;
      return {
        type: "league" as const,
        id: leagueId,
        name: league.label,
        record: league,
      };
    }

    if (selectedItemId.startsWith("node-")) {
      const nodeId = Number(selectedItemId.replace("node-", ""));
      const node = leagueNodesRecords.find((n) => n.id === nodeId);
      if (!node) return null;
      return {
        type: "node" as const,
        id: nodeId,
        name: node.name,
        nodeType: node.nodeType,
        level: node.level,
        displayOrder: node.displayOrder,
        leagueId: node.leagueId,
        parentId: node.parentId,
        breadcrumbs: getBreadcrumbs(nodeId),
        record: node,
      };
    }

    if (selectedItemId.startsWith("enrollment-")) {
      const enrollId = Number(selectedItemId.replace("enrollment-", ""));
      const enrollment = teamEnrollmentsRecords.find((e) => e.id === enrollId);
      if (!enrollment) return null;
      return {
        type: "enrollment" as const,
        id: enrollId,
        name: `${enrollment.clubName} - ${enrollment.teamName}`,
        teamName: enrollment.teamName,
        clubName: enrollment.clubName,
        seasonName: enrollment.seasonName,
        leagueNodeId: enrollment.leagueNodeId,
        leagueNodeName: enrollment.leagueNodeName,
        breadcrumbs: getBreadcrumbs(enrollment.leagueNodeId),
        record: enrollment,
      };
    }

    return null;
  }, [selectedItemId, leaguesData, leagueNodesRecords, teamEnrollmentsRecords]);

  // Teams currently enrolled in the selected node for this season
  const selectedNodeEnrollments = useMemo(() => {
    if (selectedInfo?.type !== "node") return [];
    return teamEnrollmentsRecords.filter(
      (e) =>
        e.leagueNodeId === selectedInfo.id &&
        e.seasonId === Number(selectedSeasonId),
    );
  }, [selectedInfo, teamEnrollmentsRecords, selectedSeasonId]);

  // Options for team seasons available to enroll in the selected node (exclude already enrolled)
  const availableTeamSeasonOptions = useMemo(() => {
    if (selectedInfo?.type !== "node") return [];
    const enrolledIds = selectedNodeEnrollments.map((e) => e.teamSeasonId);
    return teamSeasonsData.filter(
      (ts) => !enrolledIds.includes(Number(ts.value)),
    );
  }, [selectedInfo, selectedNodeEnrollments, teamSeasonsData]);

  // ─── Actions Handlers ───────────────────────────────────────────────────────

  // Open Add Child Node modal
  const handleOpenAddNode = (parent: typeof addParentItem) => {
    setAddParentItem(parent);
    setNodeFormName("");
    setNodeFormType("conference");
    setNodeFormParentId(parent?.type === "node" ? String(parent.nodeId) : "");
    if (parent?.type === "node") {
      const pNode = leagueNodesRecords.find((n) => n.id === parent.nodeId);
      setNodeFormLevel(String((pNode?.level || 0) + 1));
    } else {
      setNodeFormLevel("1");
    }
    setNodeFormOrder("10");
    setIsAddNodeOpen(true);
  };

  // Submit create node action
  const handleCreateNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeFormName.trim() || !addParentItem) return;

    setIsSaving(true);
    try {
      await createLeagueNode({
        leagueId: String(addParentItem.leagueId),
        parentId: nodeFormParentId,
        name: nodeFormName.trim(),
        nodeType: nodeFormType,
        level: nodeFormLevel,
        displayOrder: nodeFormOrder,
      });

      toast.success(`Sub-node "${nodeFormName}" created successfully`);
      setIsAddNodeOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create node.");
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Node modal
  const handleOpenEditNode = (node: any) => {
    setEditItem(node);
    setNodeFormName(node.name);
    setNodeFormType(node.nodeType);
    setNodeFormLevel(String(node.level || 0));
    setNodeFormOrder(String(node.displayOrder || 0));
    setNodeFormParentId(node.parentId ? String(node.parentId) : "");
    setIsEditNodeOpen(true);
  };

  // Submit edit node action
  const handleEditNodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeFormName.trim() || !editItem) return;

    setIsSaving(true);
    try {
      await updateLeagueNode(editItem.id, {
        name: nodeFormName.trim(),
        nodeType: nodeFormType,
        level: nodeFormLevel,
        displayOrder: nodeFormOrder,
        parentId: nodeFormParentId,
      });

      toast.success(`Node updated successfully`);
      setIsEditNodeOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update node.");
    } finally {
      setIsSaving(false);
    }
  };

  // Open Delete Node Dialog
  const handleOpenDeleteNode = (node: any) => {
    setDeleteItem(node);
    setIsDeleteNodeOpen(true);
  };

  // Submit delete node action
  const handleDeleteNodeConfirm = async () => {
    if (!deleteItem) return;

    try {
      await deleteLeagueNode(deleteItem.id);
      toast.success(
        `Node "${deleteItem.name}" and all its descendants removed.`,
      );
      setSelectedItemId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete node.");
    }
  };

  // Submit Enroll Team action
  const handleEnrollTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollFormTeamSeasonId || selectedInfo?.type !== "node") return;

    setIsEnrolling(true);
    try {
      await createTeamEnrollment({
        teamSeasonId: enrollFormTeamSeasonId,
        seasonId: selectedSeasonId,
        leagueNodeId: String(selectedInfo.id),
        isActive: "true",
      });

      toast.success("Team successfully enrolled in this division.");
      setEnrollFormTeamSeasonId("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll team.");
    } finally {
      setIsEnrolling(false);
    }
  };

  // Submit Unenroll Team action
  const handleUnenrollTeam = async (enrollmentId: number, teamName: string) => {
    try {
      await deleteTeamEnrollment(enrollmentId);
      toast.success(`Team "${teamName}" removed from division.`);
      if (selectedItemId === `enrollment-${enrollmentId}`) {
        setSelectedItemId(null);
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove team enrollment.");
    }
  };

  // ─── Rendering Helper functions ─────────────────────────────────────────────

  // Recursively render tree node
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = !!expandedKeys[node.id];
    const isSelected = selectedItemId === node.id;
    const hasChildren = node.children.length > 0;

    // Find matching team enrollments
    const nodeTeams =
      node.type === "node"
        ? teamEnrollmentsRecords.filter(
            (e) =>
              e.leagueNodeId === node.nodeId &&
              e.seasonId === Number(selectedSeasonId),
          )
        : [];

    const showExpand = hasChildren || nodeTeams.length > 0;

    return (
      <div key={node.id} className='select-none'>
        {/* Node Label Row */}
        <div
          onClick={() => {
            setSelectedItemId(node.id);
            if (showExpand) {
              toggleExpand(node.id);
            }
          }}
          className={`group flex items-center justify-between py-2 px-3 my-0.5 rounded-lg cursor-pointer transition-all duration-150 ${
            isSelected
              ? "bg-primary/10 text-primary border border-primary/20 shadow-sm font-semibold"
              : "hover:bg-surface-hover border border-transparent text-text"
          }`}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
        >
          <div className='flex items-center gap-2 min-w-0'>
            {showExpand ? (
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.id);
                }}
                className='text-muted hover:text-text p-0.5 rounded hover:bg-border/30 transition-transform'
                style={{
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                <ChevronRight size={14} />
              </button>
            ) : (
              <div className='w-5' />
            )}

            {node.type === "league" ? (
              <Trophy size={16} className='text-amber-500 shrink-0' />
            ) : (
              <FolderTree size={16} className='text-blue-500 shrink-0' />
            )}

            <span className='text-sm truncate'>{node.name}</span>

            {node.type === "node" && node.nodeType && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90 ${
                  node.nodeType === "conference"
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                    : node.nodeType === "division"
                      ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                      : node.nodeType === "age_group"
                        ? "bg-green-500/15 text-green-400 border border-green-500/20"
                        : "bg-gray-500/15 text-gray-400 border border-gray-500/20"
                }`}
              >
                {node.nodeType.replace("_", " ")}
              </span>
            )}
          </div>

          {/* Quick Hover Actions */}
          <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAddNode({
                  id: node.id,
                  name: node.name,
                  type: node.type,
                  leagueId: node.leagueId,
                  nodeId: node.nodeId,
                });
              }}
              title='Add sub-node'
              className='p-1 hover:bg-border/50 rounded text-muted hover:text-primary'
            >
              <Plus size={12} />
            </button>
            {node.type === "node" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEditNode(node.record);
                  }}
                  title='Edit node'
                  className='p-1 hover:bg-border/50 rounded text-muted hover:text-primary'
                >
                  <Edit size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDeleteNode(node.record);
                  }}
                  title='Delete node'
                  className='p-1 hover:bg-border/50 rounded text-muted hover:text-danger'
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Render child elements if expanded */}
        {isExpanded && (
          <div className='relative mt-0.5'>
            {/* Tree Branch Vertical Connector Line */}
            <div
              className='absolute top-0 bottom-2 w-px bg-border/40'
              style={{ left: `${depth * 14 + 19}px` }}
            />

            {/* Sub-nodes */}
            {node.children.map((child) => renderTreeNode(child, depth + 1))}

            {/* Enrolled Teams */}
            {nodeTeams.map((team) => {
              const isTeamSelected = selectedItemId === `enrollment-${team.id}`;
              return (
                <div
                  key={`enrollment-${team.id}`}
                  onClick={() => setSelectedItemId(`enrollment-${team.id}`)}
                  className={`group flex items-center justify-between py-1.5 px-3 my-0.5 rounded-lg cursor-pointer transition-all duration-150 ${
                    isTeamSelected
                      ? "bg-primary/15 text-primary border border-primary/20 font-semibold"
                      : "hover:bg-surface-hover border border-transparent text-muted hover:text-text"
                  }`}
                  style={{ paddingLeft: `${(depth + 1) * 14 + 20}px` }}
                >
                  <div className='flex items-center gap-2 min-w-0'>
                    <Shield size={14} className='text-emerald-500 shrink-0' />
                    <span className='text-xs truncate'>
                      {team.clubName} - {team.teamName}
                    </span>
                    <span className='text-[9px] px-1 bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 scale-90'>
                      TEAM
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnenrollTeam(team.id, team.teamName);
                    }}
                    title='Remove team enrollment'
                    className='opacity-0 group-hover:opacity-100 p-1 hover:bg-border/50 rounded text-muted hover:text-danger transition-opacity'
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Header Banner */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/80 pb-4'>
        <div>
          <h1 className='text-3xl font-extrabold tracking-tight text-text'>
            Leagues & Structure
          </h1>
          <p className='text-muted text-sm mt-1'>
            Build and manage hierarchical league divisions, age groups, and
            assign team rosters dynamically.
          </p>
        </div>

        {/* Season Selector Dropdown */}
        <div className='flex items-center gap-2 bg-surface/50 border border-border px-3 py-1.5 rounded-xl'>
          <Calendar size={16} className='text-primary' />
          <span className='text-xs font-semibold text-muted'>
            Enrollments Season:
          </span>
          <select
            value={selectedSeasonId}
            onChange={(e) => {
              setSelectedSeasonId(e.target.value);
              setSelectedItemId(null); // Reset selection to reload context
            }}
            className='bg-transparent text-sm font-bold text-text focus:outline-none cursor-pointer'
          >
            {seasonsData.map((s) => (
              <option
                key={s.value}
                value={s.value}
                className='bg-surface text-text'
              >
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Two Column Explorer Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
        {/* LEFT COLUMN: Tree Explorer */}
        <div className='lg:col-span-5 bg-surface border border-border/80 rounded-xl p-4 shadow-sm flex flex-col gap-4 max-h-[75vh]'>
          <div className='flex items-center gap-2'>
            <h3 className='font-bold text-sm text-text uppercase tracking-wider'>
              Hierarchy Explorer
            </h3>
            <span className='text-xs px-2 py-0.5 bg-border rounded-full text-muted font-bold'>
              {filteredTree.length} roots
            </span>
          </div>

          {/* Tree Search Box */}
          <div className='relative'>
            <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted' />
            <input
              type='text'
              placeholder='Filter leagues, nodes, teams...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full bg-surface-hover hover:bg-border/30 border border-border focus:border-primary/60 px-9 py-2 rounded-lg text-sm text-text focus:outline-none transition-all'
            />
          </div>

          {/* Collapsible Tree Container */}
          <div className='flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar min-h-[40vh]'>
            {filteredTree.length > 0 ? (
              filteredTree.map((root) => renderTreeNode(root, 0))
            ) : (
              <div className='text-center py-8 text-muted text-sm flex flex-col items-center gap-2'>
                <AlertCircle size={24} />
                <span>No results match your search.</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: details and controls panel */}
        <div className='lg:col-span-7 flex flex-col gap-6'>
          {selectedInfo ? (
            <div className='bg-surface border border-border/80 rounded-xl p-6 shadow-sm space-y-6'>
              {/* Context Breadcrumbs */}
              {selectedInfo.breadcrumbs && (
                <div className='text-xs font-semibold text-muted/80 tracking-wide uppercase flex items-center gap-1.5 flex-wrap'>
                  {selectedInfo.breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={idx}>
                      <span>{crumb}</span>
                      {idx < selectedInfo.breadcrumbs!.length - 1 && (
                        <ArrowRight size={10} className='text-muted' />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Title & Core Controls */}
              <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-5'>
                <div>
                  <div className='flex items-center gap-3'>
                    <h2 className='text-2xl font-bold text-text tracking-tight'>
                      {selectedInfo.name}
                    </h2>
                    {selectedInfo.type === "node" && (
                      <span className='text-xs px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary font-bold rounded-full uppercase'>
                        {selectedInfo.nodeType?.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className='text-muted text-xs mt-1'>
                    ID: {selectedInfo.type}-{selectedInfo.id}
                  </p>
                </div>

                {/* Operations Trigger Buttons */}
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-1.5'
                    onClick={() =>
                      handleOpenAddNode({
                        id: selectedItemId!,
                        name: selectedInfo.name,
                        type:
                          selectedInfo.type === "enrollment"
                            ? "node"
                            : selectedInfo.type,
                        leagueId:
                          selectedInfo.leagueId ||
                          (selectedInfo.record as any).leagueId,
                        nodeId:
                          selectedInfo.type === "node"
                            ? selectedInfo.id
                            : undefined,
                      })
                    }
                  >
                    <Plus size={14} />
                    <span>Sub-node</span>
                  </Button>

                  {selectedInfo.type === "node" && (
                    <>
                      <Button
                        variant='outline'
                        size='sm'
                        className='flex items-center gap-1.5'
                        onClick={() => handleOpenEditNode(selectedInfo.record)}
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant='danger'
                        size='sm'
                        className='flex items-center gap-1.5'
                        onClick={() =>
                          handleOpenDeleteNode(selectedInfo.record)
                        }
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Sub-node details card section */}
              {selectedInfo.type === "node" && (
                <div className='grid grid-cols-2 gap-4 bg-surface-hover/40 border border-border/50 rounded-xl p-4 text-sm'>
                  <div>
                    <span className='text-muted block text-xs'>
                      Hierarchy level
                    </span>
                    <span className='font-bold text-text'>
                      {selectedInfo.level ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className='text-muted block text-xs'>
                      Display order index
                    </span>
                    <span className='font-bold text-text'>
                      {selectedInfo.displayOrder ?? 0}
                    </span>
                  </div>
                </div>
              )}

              {/* Sub-nodes list under Leagues/Nodes */}
              {(selectedInfo.type === "league" ||
                selectedInfo.type === "node") && (
                <div className='space-y-3'>
                  <h4 className='font-bold text-sm text-text uppercase tracking-wider'>
                    Direct Sub-divisions / Sub-nodes
                  </h4>

                  {/* Find children nodes */}
                  {(() => {
                    const childrenNodes = leagueNodesRecords.filter((n) =>
                      selectedInfo.type === "league"
                        ? n.leagueId === selectedInfo.id && !n.parentId
                        : n.parentId === selectedInfo.id,
                    );

                    if (childrenNodes.length === 0) {
                      return (
                        <div className='text-center py-6 border border-dashed border-border rounded-xl text-muted text-sm'>
                          No sub-nodes created under this node. Click "+
                          Sub-node" above to build your hierarchy.
                        </div>
                      );
                    }

                    return (
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                        {childrenNodes.map((child) => (
                          <div
                            key={child.id}
                            onClick={() =>
                              setSelectedItemId(`node-${child.id}`)
                            }
                            className='bg-surface border border-border/80 hover:border-primary/40 hover:bg-surface-hover p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between'
                          >
                            <div className='min-w-0'>
                              <span className='font-bold text-sm text-text block truncate'>
                                {child.name}
                              </span>
                              <span className='text-[10px] text-muted uppercase font-bold tracking-wider'>
                                {child.nodeType.replace("_", " ")}
                              </span>
                            </div>
                            <ArrowRight
                              size={14}
                              className='text-muted group-hover:text-primary'
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ENROLLMENTS CONTROL PANEL (only for League Nodes) */}
              {selectedInfo.type === "node" && (
                <div className='border-t border-border/60 pt-6 space-y-4'>
                  <div className='flex justify-between items-center'>
                    <h4 className='font-bold text-sm text-text uppercase tracking-wider'>
                      Enrolled Teams ({selectedNodeEnrollments.length})
                    </h4>
                    <span className='text-xs text-muted'>
                      Season:{" "}
                      {
                        seasonsData.find((s) => s.value === selectedSeasonId)
                          ?.label
                      }
                    </span>
                  </div>

                  {/* Enroll team form */}
                  <form
                    onSubmit={handleEnrollTeamSubmit}
                    className='flex gap-2'
                  >
                    <div className='flex-1'>
                      <Select
                        value={enrollFormTeamSeasonId}
                        onChange={(e: any) =>
                          setEnrollFormTeamSeasonId(e.target.value)
                        }
                        placeholder='Choose team to enroll...'
                        options={availableTeamSeasonOptions}
                        className='w-full text-sm'
                      />
                    </div>
                    <Button
                      type='submit'
                      disabled={isEnrolling || !enrollFormTeamSeasonId}
                      className='whitespace-nowrap'
                    >
                      {isEnrolling ? "Enrolling..." : "Enroll Team"}
                    </Button>
                  </form>

                  {/* Enrolled teams list */}
                  {selectedNodeEnrollments.length > 0 ? (
                    <div className='border border-border/80 rounded-xl divide-y divide-border/60 overflow-hidden bg-surface-hover/20'>
                      {selectedNodeEnrollments.map((team) => (
                        <div
                          key={team.id}
                          className='flex justify-between items-center p-3 hover:bg-surface-hover transition-colors'
                        >
                          <div className='min-w-0'>
                            <span className='font-bold text-sm text-text block truncate'>
                              {team.clubName} - {team.teamName}
                            </span>
                            <span className='text-[10px] text-muted'>
                              Roster registered under {team.seasonName}
                            </span>
                          </div>
                          <Button
                            variant='outline'
                            size='xs'
                            className='text-danger hover:bg-danger/10 border-transparent hover:border-danger/20'
                            onClick={() =>
                              handleUnenrollTeam(team.id, team.teamName)
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-8 border border-dashed border-border rounded-xl text-muted text-sm'>
                      No teams enrolled in this division for the selected
                      season.
                    </div>
                  )}
                </div>
              )}

              {/* TEAM ENROLLMENT SPECIFIC VIEW */}
              {selectedInfo.type === "enrollment" && (
                <div className='space-y-6'>
                  <div className='bg-surface-hover/30 border border-border rounded-xl p-4 space-y-3'>
                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <span className='text-muted block text-xs'>
                          Club Organization
                        </span>
                        <span className='font-bold text-text'>
                          {(selectedInfo.record as any).clubName}
                        </span>
                      </div>
                      <div>
                        <span className='text-muted block text-xs'>
                          Roster Team Name
                        </span>
                        <span className='font-bold text-text'>
                          {(selectedInfo.record as any).teamName}
                        </span>
                      </div>
                      <div>
                        <span className='text-muted block text-xs'>
                          Competition Season
                        </span>
                        <span className='font-bold text-text'>
                          {(selectedInfo.record as any).seasonName}
                        </span>
                      </div>
                      <div>
                        <span className='text-muted block text-xs'>
                          Assigned Division / Node
                        </span>
                        <span className='font-bold text-text'>
                          {(selectedInfo.record as any).leagueNodeName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='flex justify-center border-t border-border pt-6'>
                    <Button
                      variant='danger'
                      className='w-full flex items-center justify-center gap-2'
                      onClick={() =>
                        handleUnenrollTeam(
                          selectedInfo.id,
                          selectedInfo.teamName!,
                        )
                      }
                    >
                      <Trash2 size={16} />
                      <span>Remove Team from Division Enrollment</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='bg-surface border border-border/85 rounded-xl p-8 shadow-sm text-center py-16 flex flex-col items-center justify-center gap-4 text-muted'>
              <div className='h-16 w-16 rounded-full bg-surface-hover border border-border flex items-center justify-center text-primary'>
                <FolderOpen size={28} />
              </div>
              <div className='space-y-1 max-w-sm'>
                <h4 className='font-bold text-lg text-text'>
                  Select Hierarchy Node
                </h4>
                <p className='text-sm'>
                  Click a league, conference, or age division in the hierarchy
                  explorer list to edit details, append sub-levels, or enroll
                  team seasons.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD CHILD NODE */}
      <Modal
        isOpen={isAddNodeOpen}
        onClose={() => setIsAddNodeOpen(false)}
        title={`Add Sub-node under "${addParentItem?.name}"`}
        size='md'
      >
        <form onSubmit={handleCreateNodeSubmit} className='space-y-4'>
          <div className='space-y-1.5'>
            <label className='text-sm font-bold text-text'>Parent Node</label>
            <Select
              value={nodeFormParentId}
              onChange={(e: any) => setNodeFormParentId(e.target.value)}
              placeholder="Root Level (No Parent)"
              options={leagueNodesOptionsData}
              showPlaceholder={true}
            />
          </div>

          <div className='space-y-1.5'>
            <label className='text-sm font-bold text-text'>Node Name</label>
            <Input
              type='text'
              required
              placeholder='e.g. South Atlantic Conference, U15 Boys, Premier Division'
              value={nodeFormName}
              onChange={(e: any) => setNodeFormName(e.target.value)}
            />
          </div>

          <div className='space-y-1.5'>
            <label className='text-sm font-bold text-text'>Node Type</label>
            <Select
              value={nodeFormType}
              onChange={(e: any) => setNodeFormType(e.target.value)}
              options={[
                { value: "league", label: "League" },
                { value: "conference", label: "Conference" },
                { value: "division", label: "Division" },
                { value: "group", label: "Group" },
                { value: "region", label: "Region" },
                { value: "district", label: "District" },
                { value: "classification", label: "Classification" },
                { value: "age_group", label: "Age Group" },
                { value: "gender", label: "Gender" },
              ]}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <label className='text-sm font-bold text-text'>
                Hierarchy Level
              </label>
              <Input
                type='number'
                placeholder='e.g. 1'
                value={nodeFormLevel}
                onChange={(e: any) => setNodeFormLevel(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-sm font-bold text-text'>
                Display Order
              </label>
              <Input
                type='number'
                placeholder='e.g. 10'
                value={nodeFormOrder}
                onChange={(e: any) => setNodeFormOrder(e.target.value)}
              />
            </div>
          </div>

          <div className='flex justify-end gap-2 border-t border-border pt-4 mt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsAddNodeOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSaving}>
              {isSaving ? "Saving..." : "Create Node"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT NODE */}
      <Modal
        isOpen={isEditNodeOpen}
        onClose={() => setIsEditNodeOpen(false)}
        title={`Edit Node "${editItem?.name}"`}
        size='md'
      >
        <form onSubmit={handleEditNodeSubmit} className='space-y-4'>
          <div className='space-y-1.5'>
            <label className='text-sm font-bold text-text'>Parent Node</label>
            <Select
              value={nodeFormParentId}
              onChange={(e: any) => setNodeFormParentId(e.target.value)}
              placeholder="Root Level (No Parent)"
              options={leagueNodesOptionsData.filter(opt => Number(opt.value) !== editItem?.id)}
              showPlaceholder={true}
            />
          </div>

          <div className='space-y-1.5'>
            <label className='text-sm font-bold text-text'>Node Name</label>
            <Input
              type='text'
              required
              value={nodeFormName}
              onChange={(e: any) => setNodeFormName(e.target.value)}
            />
          </div>

          <div className='space-y-1.5'>
            <label className='text-sm font-bold text-text'>Node Type</label>
            <Select
              value={nodeFormType}
              onChange={(e: any) => setNodeFormType(e.target.value)}
              options={[
                { value: "league", label: "League" },
                { value: "conference", label: "Conference" },
                { value: "division", label: "Division" },
                { value: "group", label: "Group" },
                { value: "region", label: "Region" },
                { value: "district", label: "District" },
                { value: "classification", label: "Classification" },
                { value: "age_group", label: "Age Group" },
                { value: "gender", label: "Gender" },
              ]}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <label className='text-sm font-bold text-text'>
                Hierarchy Level
              </label>
              <Input
                type='number'
                value={nodeFormLevel}
                onChange={(e: any) => setNodeFormLevel(e.target.value)}
              />
            </div>
            <div className='space-y-1.5'>
              <label className='text-sm font-bold text-text'>
                Display Order
              </label>
              <Input
                type='number'
                value={nodeFormOrder}
                onChange={(e: any) => setNodeFormOrder(e.target.value)}
              />
            </div>
          </div>

          <div className='flex justify-end gap-2 border-t border-border pt-4 mt-6'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsEditNodeOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DIALOG: DELETE NODE CONFIRM */}
      <Dialog
        isOpen={isDeleteNodeOpen}
        onClose={() => setIsDeleteNodeOpen(false)}
        title='Confirm Node Deletion'
        message={`Are you sure you want to delete "${deleteItem?.name}"?\nThis action will also delete all sub-divisions/descendant nodes and team enrollments under it. This cannot be undone.`}
        type='warning'
        confirmText='Delete Node'
        cancelText='Cancel'
        onConfirm={handleDeleteNodeConfirm}
      />
    </div>
  );
}
