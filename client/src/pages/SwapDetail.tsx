import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, Check, X, MessageCircle, Star, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import StarRating from '../components/ui/StarRating';
import { swapsApi, reviewsApi } from '../lib/api';
import { adaptSwap, ApiSwap } from '../lib/api/types';
import { SwapRequest } from '../lib/mockData';

interface SwapDetailProps {
  params: { id: string };
}

export default function SwapDetail({ params }: SwapDetailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [raw, setRaw] = useState<ApiSwap | null>(null);
  const [swap, setSwap] = useState<SwapRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await swapsApi.byId(params.id);
      setRaw(r);
      if (user) setSwap(adaptSwap(r, user.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load swap.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user]);

  if (loading) {
    return (
      <div className="pt-32 flex justify-center text-primary/40">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (!swap || !raw || !user) {
    return (
      <div className="pt-32">
        <EmptyState
          title="Swap not found"
          message="This request may have been removed."
          actionLabel="Back to swaps"
          onAction={() => setLocation('/swaps')}
        />
      </div>
    );
  }

  const offered = raw.senderItem;
  const requested = raw.receiverItem;
  const from = raw.sender;
  const to = raw.receiver;
  const isReceiver = String(raw.receiverId) === user.id;
  const otherParty = isReceiver ? from : to;

  const statusColors: Record<typeof swap.status, string> = {
    pending: 'from-amber-400 to-amber-500',
    accepted: 'from-emerald-500 to-emerald-600',
    rejected: 'from-red-500 to-red-600',
    completed: 'from-teal-500 to-teal-600',
    cancelled: 'from-gray-400 to-gray-500',
  };

  const handleStatus = async (next: 'accepted' | 'rejected' | 'cancelled' | 'completed') => {
    setActing(true);
    try {
      const updated = await swapsApi.updateStatus(raw.id, next);
      setRaw(updated);
      setSwap(adaptSwap(updated, user.id));
      toast(`Swap ${next}.`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Action failed.', 'error');
    } finally {
      setActing(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      toast('Add a short comment to publish your review.', 'error');
      return;
    }
    if (!otherParty) return;
    setSubmittingReview(true);
    try {
      await reviewsApi.create({
        swapRequestId: raw.id,
        revieweeId: Number(otherParty.id),
        rating,
        comment,
      });
      toast(`${rating}★ review submitted. Thank you!`, 'success');
      setShowReview(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Submit failed.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="pt-20 sm:pt-24 pb-24 bg-background relative z-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link href="/swaps">
          <button className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary/60 hover:text-primary transition-colors mb-4">
            <ArrowLeft size={12} /> Back to all swaps
          </button>
        </Link>

        {/* Status banner */}
        <div className={`rounded-xl px-5 py-4 bg-gradient-to-r ${statusColors[swap.status]} text-white mb-4 flex items-center justify-between flex-wrap gap-2`}>
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] font-bold opacity-80">Status</p>
            <p className="font-headings text-lg sm:text-xl font-bold capitalize">{swap.status}</p>
          </div>
          <p className="text-xs font-semibold opacity-80">Updated · {swap.updatedAt}</p>
        </div>

        {/* Items panel */}
        <div className="rounded-xl border border-border/60 bg-background p-4 sm:p-5 mb-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { side: 'Offered', item: offered, by: from },
              { side: 'Requested', item: requested, by: to },
            ].map((panel) =>
              panel.item ? (
                <div key={panel.side}>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                    {panel.side}{panel.by?.name ? ` by ${panel.by.name.split(' ')[0]}` : ''}
                  </p>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted/30 mb-2">
                    {panel.item.images?.[0]?.url && (
                      <img src={panel.item.images[0].url} alt={panel.item.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <h3 className="font-headings text-base font-bold text-primary">{panel.item.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <Badge color="gray">Size {panel.item.size}</Badge>
                    <Badge color="accent">{panel.item.condition.replace('_', ' ')}</Badge>
                  </div>
                  <Link href={`/items/${panel.item.id}`}>
                    <button className="mt-2 text-[11px] font-bold uppercase tracking-wider text-accent hover:underline">
                      View listing →
                    </button>
                  </Link>
                </div>
              ) : null
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          {[
            { label: 'From', user: from },
            { label: 'To', user: to },
          ].map((p) =>
            p.user ? (
              <Link key={p.label} href={`/users/${p.user.id}`}>
                <div className="rounded-xl border border-border/60 bg-background p-3 flex items-center gap-3 hover:border-accent transition-colors cursor-pointer">
                  {p.user.profileImage && (
                    <img src={p.user.profileImage} alt={p.user.name || ''} className="w-9 h-9 rounded-full object-cover" />
                  )}
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      {p.label}
                    </p>
                    <p className="font-headings font-bold text-primary text-sm">{p.user.name}</p>
                  </div>
                </div>
              </Link>
            ) : null
          )}
        </div>

        {swap.message && (
          <div className="rounded-xl bg-muted/30 border border-border/60 p-4 mb-4">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
              Personal message
            </p>
            <p className="text-sm italic text-primary/80 leading-relaxed">"{swap.message}"</p>
          </div>
        )}

        {/* Timeline */}
        {swap.timeline && (
          <div className="rounded-xl border border-border/60 bg-background p-5 mb-4">
            <h3 className="font-headings text-base font-bold text-primary mb-3">Timeline</h3>
            <div className="relative pl-5 space-y-3 border-l-2 border-border/60">
              {swap.timeline.map((t, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[24px] top-1 w-3 h-3 rounded-full bg-accent ring-4 ring-background" />
                  <p className="font-bold text-primary text-xs">{t.status}</p>
                  <p className="text-[11px] text-muted-foreground">{t.at}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border/60 px-4 py-2.5 z-30">
        <div className="max-w-3xl mx-auto flex justify-end gap-1.5 flex-wrap">
          {swap.status === 'pending' && isReceiver && (
            <>
              <button
                disabled={acting}
                onClick={() => handleStatus('rejected')}
                className="px-4 py-2 rounded-lg border border-red-200 text-red-600 font-bold uppercase tracking-wider text-[11px] hover:bg-red-50 flex items-center gap-1.5 disabled:opacity-60"
              >
                <X size={12} /> Reject
              </button>
              <button
                disabled={acting}
                onClick={() => handleStatus('accepted')}
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-bold uppercase tracking-wider text-[11px] hover:bg-accent/90 flex items-center gap-1.5 disabled:opacity-60"
              >
                <Check size={12} /> Accept
              </button>
            </>
          )}
          {swap.status === 'pending' && !isReceiver && (
            <button
              disabled={acting}
              onClick={() => handleStatus('cancelled')}
              className="px-4 py-2 rounded-lg border border-border/60 text-primary font-bold uppercase tracking-wider text-[11px] hover:bg-muted/40 flex items-center gap-1.5 disabled:opacity-60"
            >
              <X size={12} /> Cancel request
            </button>
          )}
          {swap.status === 'accepted' && (
            <>
              {swap.conversationId && (
                <Link href={`/chat/${swap.conversationId}`}>
                  <button className="px-4 py-2 rounded-lg bg-primary text-white font-bold uppercase tracking-wider text-[11px] hover:bg-primary/90 flex items-center gap-1.5">
                    <MessageCircle size={12} /> Open chat
                  </button>
                </Link>
              )}
              <button
                disabled={acting}
                onClick={() => handleStatus('completed')}
                className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-bold uppercase tracking-wider text-[11px] hover:bg-accent/90 flex items-center gap-1.5 disabled:opacity-60"
              >
                <Check size={12} /> Mark completed
              </button>
            </>
          )}
          {swap.status === 'completed' && (
            <button
              onClick={() => setShowReview(true)}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-bold uppercase tracking-wider text-[11px] hover:bg-accent/90 flex items-center gap-1.5"
            >
              <Star size={12} /> Leave a review
            </button>
          )}
        </div>
      </div>

      <Modal isOpen={showReview} onClose={() => setShowReview(false)} title="Leave a review" size="md">
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              How was your swap with {otherParty?.name || 'your swap partner'}?
            </p>
            <StarRating value={rating} onChange={setRating} size={28} />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-primary/80">Your comment</label>
            <textarea
              maxLength={500}
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was the description accurate? Was the user pleasant to swap with?"
              className="w-full mt-2 px-4 py-3 rounded-xl bg-muted/20 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <button
            onClick={handleSubmitReview}
            disabled={submittingReview}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-bold uppercase tracking-wider text-xs hover:bg-primary/90 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submittingReview && <Loader2 size={14} className="animate-spin" />}
            Publish review
          </button>
        </div>
      </Modal>
    </div>
  );
}
