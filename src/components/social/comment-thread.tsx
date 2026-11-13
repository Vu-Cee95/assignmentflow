"use client";

import { useState } from "react";
import { Bookmark, Heart, Pencil, Reply, Send, Trash2 } from "lucide-react";
import { useApp } from "@/lib/store";
import type { Comment, CommentId, MessageId } from "@/lib/domain/types";
import { timeAgo, uid, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { DeleteConfirm } from "@/components/ui/delete-confirm";

interface CommentNode {
  comment: Comment;
  children: CommentNode[];
}

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

const AVATAR_PALETTE = [
  "bg-calm-blue-light text-calm-blue",
  "bg-peach-light text-peach",
  "bg-sage-light text-sage",
  "bg-line text-muted",
  "bg-calm-blue/20 text-calm-blue",
  "bg-peach/20 text-peach",
];

function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0]!;
}

function getAuthorLabel(name: string, user: { name: string } | null): string {
  return user && name === user.name ? "You" : name;
}

function CommentComposer({
  postId,
  parentId,
  replyingTo,
  autoFocus,
  onCancelReply,
  placeholder,
}: {
  postId: MessageId;
  parentId: CommentId | null;
  replyingTo: string | null;
  autoFocus?: boolean;
  onCancelReply?: () => void;
  placeholder?: string;
}) {
  const { state, dispatch } = useApp();
  const [draft, setDraft] = useState("");

  const canSend = draft.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    const comment: Comment = {
      id: uid("cmt") as CommentId,
      postId,
      parentId,
      author: state.user?.name ?? "You",
      content: draft.trim(),
      time: new Date().toISOString(),
      likes: 0,
      likedByMe: false,
    };
    dispatch({ type: "ADD_COMMENT", comment });
    setDraft("");
    onCancelReply?.();
  };

  return (
    <div className="flex items-start gap-2">
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold",
          avatarColor(state.user?.name ?? "You")
        )}
        aria-hidden="true"
      >
        {avatarInitials(state.user?.name ?? "You")}
      </span>
      <div className="flex-1">
        {replyingTo && (
          <p className="mb-1 text-xs font-semibold text-calm-blue">
            Replying to {replyingTo}
            <button
              type="button"
              className="ml-2 text-muted underline cursor-pointer"
              onClick={onCancelReply}
            >
              cancel
            </button>
          </p>
        )}
        <div className="flex gap-2">
          <label htmlFor={`comment-${postId}-${parentId ?? "root"}`} className="sr-only">
            Add a comment
          </label>
          <input
            id={`comment-${postId}-${parentId ?? "root"}`}
            value={draft}
            autoFocus={autoFocus}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={placeholder ?? "Write a comment…"}
            className="min-w-0 flex-1 rounded-full border border-line bg-canvas px-3.5 py-2 text-sm text-ink placeholder:text-muted/70"
          />
          <Button
            size="sm"
            icon={<Send className="size-4" aria-hidden="true" />}
            aria-label="Post comment"
            disabled={!canSend}
            onClick={submit}
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentRow({
  node,
  depth,
  postAuthor,
  replyParent,
  setReplyParent,
}: {
  node: CommentNode;
  depth: number;
  postAuthor: string;
  replyParent: CommentId | null;
  setReplyParent: (id: CommentId | null) => void;
}) {
  const { state, dispatch } = useApp();
  const c = node.comment;
  const author = getAuthorLabel(c.author, state.user);

  const isCommentAuthor = !!state.user && (c.author === state.user.name || (c.author === "You" && !!state.user.name));
  const isPostOwner =
    !!state.user &&
    (postAuthor === state.user.name || (postAuthor === "You" && !!state.user.name));
  const canModify = isCommentAuthor || isPostOwner;

  const liked = c.likedByMe;
  const saved = state.commentSavedIds.includes(c.id);

  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(c.content);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const saveEdit = () => {
    const trimmed = editDraft.trim();
    if (trimmed && trimmed !== c.content) {
      dispatch({ type: "UPDATE_COMMENT", id: c.id, content: trimmed });
    }
    setEditing(false);
  };

  const deleteComment = () => {
    dispatch({ type: "DELETE_COMMENT", id: c.id });
    setConfirmOpen(false);
  };

  return (
    <li className={cn(depth === 0 && "mt-3")}>
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold",
            avatarColor(c.author)
          )}
          aria-hidden="true"
        >
          {avatarInitials(c.author)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="rounded-xl bg-canvas px-3 py-2">
            <div className="flex items-baseline gap-2">
              <p className="text-xs font-bold text-ink">{author}</p>
              <span className="text-[11px] text-muted">{timeAgo(c.time)}</span>
              {c.editedAt && (
                <span className="text-[11px] italic text-muted">(edited)</span>
              )}
            </div>
            {editing ? (
              <div className="mt-1 flex flex-col gap-2">
                <textarea
                  aria-label={`Edit comment by ${author}`}
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      saveEdit();
                    }
                  }}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-calm-blue bg-surface px-2.5 py-2 text-sm text-ink"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" onClick={saveEdit} disabled={!editDraft.trim() || editDraft.trim() === c.content}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditDraft(c.content); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-0.5 break-words text-sm text-ink">{c.content}</p>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs font-bold text-muted">
            <Tooltip label={liked ? "Unlike" : "Like"}>
              <button
                type="button"
                onClick={() => dispatch({ type: "TOGGLE_COMMENT_LIKE", id: c.id })}
                aria-pressed={liked}
                aria-label={liked ? "Unlike this comment" : "Like this comment"}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 transition-colors cursor-pointer",
                  liked ? "text-peach" : "hover:bg-line/50 hover:text-peach"
                )}
              >
                <Heart className={cn("size-3.5", liked && "fill-current")} aria-hidden="true" />
                {c.likes > 0 && <span>{c.likes}</span>}
              </button>
            </Tooltip>
            <Tooltip label="Reply">
              <button
                type="button"
                onClick={() => {
                  if (replyParent === c.id) setReplyParent(null);
                  else setReplyParent(c.id);
                }}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-line/50 cursor-pointer"
                aria-pressed={replyParent === c.id}
                aria-label={`Reply to ${author}`}
              >
                <Reply className="size-3.5" aria-hidden="true" />
              </button>
            </Tooltip>
            <Tooltip label={saved ? "Remove bookmark" : "Bookmark"}>
              <button
                type="button"
                onClick={() => dispatch({ type: "TOGGLE_COMMENT_BOOKMARK", id: c.id })}
                aria-pressed={saved}
                aria-label={saved ? "Remove bookmark" : "Bookmark this comment"}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 transition-colors cursor-pointer",
                  saved ? "text-calm-blue" : "hover:bg-line/50 hover:text-calm-blue"
                )}
              >
                <Bookmark className={cn("size-3.5", saved && "fill-current")} aria-hidden="true" />
              </button>
            </Tooltip>
            {canModify && !editing && (
              <>
                {isCommentAuthor && (
                  <Tooltip label="Edit">
                    <button
                      type="button"
                      onClick={() => { setEditDraft(c.content); setEditing(true); setConfirmOpen(false); }}
                      aria-label={`Edit comment by ${author}`}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-line/50 cursor-pointer"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                  </Tooltip>
                )}
                {confirmOpen ? (
                  <DeleteConfirm
                    title={`comment by ${author}`}
                    onConfirm={deleteComment}
                    onCancel={() => setConfirmOpen(false)}
                  />
                ) : (
                  <Tooltip label="Delete">
                    <button
                      type="button"
                      onClick={() => setConfirmOpen(true)}
                      aria-label={`Delete comment by ${author}`}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:bg-peach-light hover:text-peach cursor-pointer"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </Tooltip>
                )}
              </>
            )}
          </div>
          {replyParent === c.id && (
            <div className="mt-1.5">
              <CommentComposer
                postId={c.postId}
                parentId={c.id}
                replyingTo={author}
                autoFocus
                onCancelReply={() => setReplyParent(null)}
                placeholder={`Reply to ${author}…`}
              />
            </div>
          )}
          {node.children.length > 0 && (
            <ul className="ml-1 mt-2 border-l-2 border-line/60 pl-3 space-y-1">
              {node.children.map((child) => (
                <CommentRow
                  key={child.comment.id}
                  node={child}
                  depth={depth + 1}
                  postAuthor={postAuthor}
                  replyParent={replyParent}
                  setReplyParent={setReplyParent}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

export function CommentSection({
  postId,
  postAuthor,
}: {
  postId: MessageId;
  postAuthor: string;
}) {
  const { state } = useApp();
  const [replyParent, setReplyParent] = useState<CommentId | null>(null);

  const postComments = state.comments.filter((c) => c.postId === postId);

  const byParent = new Map<CommentId, Comment[]>();
  for (const c of postComments) {
    if (!c.parentId) continue;
    const arr = byParent.get(c.parentId) ?? [];
    arr.push(c);
    byParent.set(c.parentId, arr);
  }

  const buildNode = (comment: Comment): CommentNode => ({
    comment,
    children: (byParent.get(comment.id) ?? [])
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .map(buildNode),
  });

  const roots = postComments
    .filter((c) => c.parentId === null)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .map(buildNode);

  const total = postComments.length;

  return (
    <div className="mt-3" aria-live="polite">
      {total > 0 && (
        <ul>
          {roots.map((root) => (
            <CommentRow
              key={root.comment.id}
              node={root}
              depth={0}
              postAuthor={postAuthor}
              replyParent={replyParent}
              setReplyParent={setReplyParent}
            />
          ))}
        </ul>
      )}
      <div className={cn(total > 0 && "mt-3")}>
        <CommentComposer
          postId={postId}
          parentId={null}
          replyingTo={null}
          placeholder={total > 0 ? "Write a comment…" : "Be the first to comment…"}
        />
      </div>
    </div>
  );
}

export function commentCount(state: { comments: Comment[] }, postId: MessageId): number {
  return state.comments.filter((c) => c.postId === postId).length;
}