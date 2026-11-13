"use client";

import { useMemo, useState } from "react";
import { Bookmark, Heart, MessageCircle, MessagesSquare, Pencil, Send, Trash2, Users, Video } from "lucide-react";
import { useApp } from "@/lib/store";
import { todayTarget } from "@/lib/domain/state";
import { COLLECTIVE_ACHIEVED, COLLECTIVE_GOAL } from "@/lib/data/mock";
import type { MessageId, SupportMessage } from "@/lib/domain/types";
import { timeAgo, uid, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { DeleteConfirm } from "@/components/ui/delete-confirm";
import { CommentSection, commentCount } from "@/components/social/comment-thread";

const ROOMS = [
  { id: "room-hci", name: "HCI lounge", online: 12 },
  { id: "room-prog", name: "PROG code corner", online: 8 },
  { id: "room-late", name: "2am survivors", online: 21 },
] as const;

const ALL_KEY = "__all__";

function msgGroupKey(msg: SupportMessage) {
  return `${msg.moduleCode}·${msg.assignmentTitle}`;
}

export function SocialView() {
  const { state, dispatch } = useApp();
  const [room, setRoom] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<string>(ALL_KEY);
  const [openComments, setOpenComments] = useState<Set<MessageId>>(new Set());
  const [confirmDeletePost, setConfirmDeletePost] = useState<MessageId | null>(null);
  const [editingPost, setEditingPost] = useState<MessageId | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const toggleComments = (id: MessageId) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEdit = (id: MessageId, content: string) => {
    setEditDraft(content);
    setEditingPost(id);
    setConfirmDeletePost(null);
  };

  const savePostEdit = (id: MessageId) => {
    const trimmed = editDraft.trim();
    if (trimmed) dispatch({ type: "UPDATE_SUPPORT_MESSAGE", id, content: trimmed });
    setEditingPost(null);
  };

  const toggleHeart = (id: MessageId) => dispatch({ type: "TOGGLE_HEART", id });

  // ---- Active assignment (for default filter and composer tagging) ----
  const activeAssignment = useMemo(() => {
    const target = todayTarget(state);
    const id = state.activeAssignmentId ?? target?.assignmentId;
    return id ? state.assignments.find((a) => a.id === id) ?? null : null;
  }, [state]);

  const activeModule = activeAssignment?.code ?? "";
  const activeTitle = activeAssignment?.title ?? "";

  // ---- Assignment groups present in messages ----
  const groups = useMemo(() => {
    const map = new Map<string, { moduleCode: string; assignmentTitle: string; count: number }>();
    for (const msg of state.supportMessages) {
      const key = msgGroupKey(msg);
      const g = map.get(key);
      if (g) {
        g.count++;
      } else {
        map.set(key, { moduleCode: msg.moduleCode, assignmentTitle: msg.assignmentTitle, count: 1 });
      }
    }
    return [...map.values()];
  }, [state.supportMessages]);

  // ---- Filtered + sorted messages (matching-active first) ----
  const messages = useMemo(() => {
    const filtered =
      filter === ALL_KEY
        ? state.supportMessages
        : state.supportMessages.filter((m) => msgGroupKey(m) === filter);
    return [...filtered].sort((a, b) => {
      const aMatch = a.moduleCode === activeModule && a.assignmentTitle === activeTitle ? 0 : 1;
      const bMatch = b.moduleCode === activeModule && b.assignmentTitle === activeTitle ? 0 : 1;
      return aMatch !== bMatch ? aMatch - bMatch : new Date(b.time).getTime() - new Date(a.time).getTime();
    });
  }, [state.supportMessages, filter, activeModule, activeTitle]);

  // ---- Active filter key for default chip highlight ----
  const defaultKey = activeModule ? `${activeModule}·${activeTitle}` : ALL_KEY;

  const post = () => {
    if (!draft.trim()) return;
    const message: SupportMessage = {
      id: uid("msg") as MessageId,
      author: state.user?.name ?? "You",
      content: draft.trim(),
      time: new Date().toISOString(),
      moduleCode: activeModule,
      assignmentTitle: activeTitle,
    };
    dispatch({ type: "ADD_SUPPORT_MESSAGE", message });
    setDraft("");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Social</h1>
        <p className="text-sm text-muted">
          You don't have to do this alone — posts are grouped by the assignment you're working on.
        </p>
      </header>

      <section aria-label="Study rooms" className="grid gap-3 sm:grid-cols-3">
        {ROOMS.map((r) => (
          <Card
            key={r.id}
            className={cn(
              "!p-4 cursor-pointer transition-colors",
              room === r.id && "!border-calm-blue !bg-calm-blue-light/40"
            )}
          >
            <button
              type="button"
              className="w-full text-left cursor-pointer"
              onClick={() => setRoom(r.id === room ? null : r.id)}
              aria-pressed={room === r.id}
            >
              <span className="flex items-center justify-between">
                <Video className="size-5 text-calm-blue" aria-hidden="true" />
                <Badge tone="success">{r.online} online</Badge>
              </span>
              <p className="mt-2 font-bold text-ink">{r.name}</p>
              <p className="mt-0.5 text-sm text-muted">
                {room === r.id
                  ? "You joined a silent study room — no scores, no leaderboards."
                  : "Silent study. Sit with others. No competition."}
              </p>
            </button>
          </Card>
        ))}
      </section>

      <section aria-label="Support wall" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Support wall</h2>
          <Badge tone="neutral">{state.supportMessages.length} posts</Badge>
        </div>

        {/* Assignment group filter chips */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter posts by assignment">
          <button
            role="tab"
            aria-selected={filter === ALL_KEY}
            onClick={() => setFilter(ALL_KEY)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors",
              filter === ALL_KEY
                ? "bg-calm-blue text-white"
                : "bg-line/50 text-muted hover:bg-line"
            )}
          >
            All posts
          </button>
          {groups.map((g) => {
            const key = `${g.moduleCode}·${g.assignmentTitle}`;
            const isActive = key === defaultKey;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1",
                  filter === key
                    ? "bg-calm-blue text-white"
                    : "bg-line/50 text-muted hover:bg-line"
                )}
              >
                {isActive && <span className="inline-block size-1.5 rounded-full bg-sage" />}
                {g.moduleCode} · {g.assignmentTitle} ({g.count})
              </button>
            );
          })}
          {groups.length === 0 && (
            <span className="text-xs text-muted">No posts yet — be the first.</span>
          )}
        </div>

        {/* Compose */}
        <Card className="space-y-2">
          <label htmlFor="support-draft" className="sr-only">Write a support message</label>
          <div className="flex gap-2">
            <input
              id="support-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                activeModule
                  ? `Post under ${activeModule} · ${activeTitle}…`
                  : "Share a win, a struggle, or a half-finished paragraph…"
              }
              className="flex-1 rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70"
            />
            <Button icon={<Send className="size-4" aria-hidden="true" />} disabled={!draft.trim()} onClick={post}>
              Post
            </Button>
          </div>
          {activeModule ? (
            <p className="text-xs text-muted">
              Posted as <strong className="text-ink">You</strong> under{" "}
              <strong className="text-calm-blue">{activeModule} · {activeTitle}</strong> so your peers in the same assignment see it.
            </p>
          ) : (
            <p className="text-xs text-muted">Posts are anonymous to everyone except you.</p>
          )}
        </Card>

        {/* Messages */}
        <ul className="grid gap-3">
          {messages.map((m) => {
            const hearted = state.heartedMessageIds.includes(m.id);
            const commentsOpen = openComments.has(m.id);
            const count = commentCount(state, m.id);
            const bookmarked = state.bookmarkedMessageIds.includes(m.id);
            const isMyPost =
              (state.user?.name && m.author === state.user.name) ||
              (m.author === "You" && !!state.user?.name);
            const postLabel = isMyPost ? "You" : "Anonymous";
            const editing = editingPost === m.id;
            return (
              <li key={m.id}>
                <Card className="!py-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-calm-blue-light text-calm-blue">
                      <MessageCircle className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold text-muted">
                          {postLabel} · {timeAgo(m.time)}
                        </p>
                        {(m.moduleCode || m.assignmentTitle) && (
                          <Badge tone="primary" className="!px-2 !py-0.5">
                            {m.moduleCode}{m.moduleCode && m.assignmentTitle ? " · " : ""}{m.assignmentTitle}
                          </Badge>
                        )}
                      </div>
                      {editing ? (
                        <div className="mt-1 flex flex-col gap-2">
                          <label htmlFor={`edit-post-${m.id}`} className="sr-only">Edit post content</label>
                          <textarea
                            id={`edit-post-${m.id}`}
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                savePostEdit(m.id);
                              }
                            }}
                            rows={2}
                            className="w-full resize-none rounded-lg border border-calm-blue bg-surface px-2.5 py-2 text-sm text-ink"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => savePostEdit(m.id)}
                              disabled={!editDraft.trim() || editDraft.trim() === m.content}
                            >
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setEditingPost(null); setEditDraft(m.content); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-ink">{m.content}</p>
                      )}
                    </div>
                  </div>
<div className="mt-3 flex items-center gap-1 border-t border-line/50 pt-2">
                    <Tooltip label={hearted ? "Remove heart" : "Heart"}>
                      <button
                        type="button"
                        onClick={() => toggleHeart(m.id)}
                        aria-pressed={hearted}
                        aria-label={hearted ? "Remove heart" : "Heart this post"}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                          hearted
                            ? "text-peach"
                            : "text-muted hover:bg-peach-light hover:text-peach"
                        )}
                      >
                        <Heart className={cn("size-4", hearted && "fill-current")} aria-hidden="true" />
                        {(m.hearts ?? 0) > 0 && <span>{m.hearts}</span>}
                      </button>
                    </Tooltip>
                    <Tooltip label={commentsOpen ? "Hide comments" : "Comments"}>
                      <button
                        type="button"
                        onClick={() => toggleComments(m.id)}
                        aria-expanded={commentsOpen}
                        aria-controls={`comments-${m.id}`}
                        aria-label={commentsOpen ? "Hide comments" : "Show comments"}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                          commentsOpen ? "text-calm-blue" : "text-muted hover:bg-calm-blue-light hover:text-calm-blue"
                        )}
                      >
                        <MessagesSquare className="size-4" aria-hidden="true" />
                        {count > 0 && <span>{count}</span>}
                      </button>
                    </Tooltip>
                    <Tooltip label={bookmarked ? "Remove bookmark" : "Bookmark"}>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "TOGGLE_POST_BOOKMARK", id: m.id })}
                        aria-pressed={bookmarked}
                        aria-label={bookmarked ? "Remove bookmark" : "Bookmark this post"}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer",
                          bookmarked ? "text-calm-blue" : "text-muted hover:bg-calm-blue-light hover:text-calm-blue"
                        )}
                      >
                        <Bookmark className={cn("size-4", bookmarked && "fill-current")} aria-hidden="true" />
                      </button>
                    </Tooltip>
                    {isMyPost && (
                      <span className="ml-auto flex items-center gap-1">
                        <Tooltip label="Edit post">
                          <button
                            type="button"
                            onClick={() => startEdit(m.id, m.content)}
                            aria-label="Edit this post"
                            className="inline-flex items-center rounded-full px-2.5 py-1.5 text-muted transition-colors hover:bg-calm-blue-light hover:text-calm-blue cursor-pointer"
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </button>
                        </Tooltip>
                        {confirmDeletePost === m.id ? (
                          <DeleteConfirm
                            title="this post"
                            onConfirm={() => {
                              dispatch({ type: "DELETE_SUPPORT_MESSAGE", id: m.id });
                              setConfirmDeletePost(null);
                              setOpenComments((prev) => { const next = new Set(prev); next.delete(m.id); return next; });
                            }}
                            onCancel={() => setConfirmDeletePost(null)}
                          />
                        ) : (
                          <Tooltip label="Delete">
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePost(m.id)}
                              aria-label="Delete this post"
                              className="inline-flex items-center rounded-full px-2.5 py-1.5 text-muted transition-colors hover:bg-peach-light hover:text-peach cursor-pointer"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </Tooltip>
                        )}
                      </span>
                    )}
                  </div>
                  {commentsOpen && (
                    <div id={`comments-${m.id}`} className="mt-2">
                      <CommentSection postId={m.id} postAuthor={m.author} />
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
          {messages.length === 0 && (
            <li>
              <Card className="text-center py-6">
                <p className="text-sm text-muted">No posts for this assignment yet.</p>
              </Card>
            </li>
          )}
        </ul>
      </section>

      <section aria-label="Community goal" className="grid gap-3 sm:grid-cols-2">
        <Card tone="primary">
          <p className="flex items-center gap-2 font-bold text-ink">
            <Users className="size-4 text-calm-blue" aria-hidden="true" />
            Collective step
          </p>
          <p className="mt-1 text-sm text-muted">
            Five hundred students completed a target today. The community has banked{" "}
            <strong className="text-calm-blue">{COLLECTIVE_ACHIEVED} XP</strong> of {COLLECTIVE_GOAL} XP this cycle.
          </p>
          <Progress className="mt-3" value={COLLECTIVE_ACHIEVED} max={COLLECTIVE_GOAL} label="Community XP progress" tone="primary" />
        </Card>
        <Card tone="accent">
          <p className="font-bold text-ink">Tomorrow's help circle</p>
          <p className="mt-1 text-sm text-muted">
            3 students plan to work on <em>Implement FlowCite reference builder</em>. Reflect on your session and
            heart a post — support is part of the study plan.
          </p>
        </Card>
      </section>
    </div>
  );
}