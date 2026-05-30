import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Edit, MapPin, Calendar, Star, Flag, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  User as UserType,
} from '../lib/mockData';
import type { Item as UIItem, SwapRequest as UISwap, Review as UIReview } from '../lib/mockData';
import { itemsApi, swapsApi, usersApi, reportsApi } from '../lib/api';
import {
  adaptItem,
  adaptUser,
  adaptSwap,
  adaptReview,
  ApiUser,
} from '../lib/api/types';
import ItemCard from '../components/ui/ItemCard';
import Badge from '../components/ui/Badge';
import StarRating from '../components/ui/StarRating';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';

interface ProfileProps {
  params?: { id?: string };
  isPublic?: boolean;
}

type Tab = 'overview' | 'listings' | 'history' | 'reviews';

export default function Profile({ params, isPublic = false }: ProfileProps) {
  const [, setLocation] = useLocation();
  const { user: me, apiUser, updateUser } = useAuth();
  const { toast } = useToast();
  const targetId = isPublic ? params?.id : me?.id;
  const isMe = !isPublic;

  const [user, setUser] = useState<UserType | null>(null);
  const [apiTargetUser, setApiTargetUser] = useState<ApiUser | null>(null);
  const [items, setItems] = useState<UIItem[]>([]);
  const [userSwaps, setUserSwaps] = useState<UISwap[]>([]);
  const [userReviews, setUserReviews] = useState<UIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [showEdit, setShowEdit] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    phone: '',
    gender: 'female' as 'male' | 'female' | 'other',
    dob: '',
    avatar: '',
  });
  const [reportForm, setReportForm] = useState({ reason: 'Inappropriate', description: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const userPromise = isPublic
      ? usersApi.byId(targetId).then((u) => {
          if (cancelled) return null;
          setApiTargetUser(u);
          const ui = adaptUser(u);
          setUser(ui);
          return u;
        })
      : Promise.resolve(apiUser).then((u) => {
          if (!u || cancelled) return null;
          setApiTargetUser(u);
          if (me) setUser(me);
          return u;
        });

    userPromise
      .then(async (u) => {
        if (!u || cancelled) return;

        const itemsPromise = itemsApi
          .byUser(u.id, 1, 50)
          .then(({ items: list }) => {
            const mapped = list.map((i) => adaptItem(i));
            return isPublic ? mapped.filter((i) => i.is_available) : mapped;
          })
          .catch(() => [] as UIItem[]);

        const reviewsPromise = usersApi
          .reviews(u.id, 1, 20)
          .then(({ items: list }) => list.map(adaptReview))
          .catch(() => [] as UIReview[]);

        const swapsPromise = isMe
          ? swapsApi
              .list({ role: 'all', limit: 50 })
              .then(({ items: list }) => list.map((s) => adaptSwap(s, String(u.id))))
              .catch(() => [] as UISwap[])
          : Promise.resolve([] as UISwap[]);

        const [its, revs, sws] = await Promise.all([itemsPromise, reviewsPromise, swapsPromise]);
        if (cancelled) return;

        setItems(its);
        setUserReviews(revs);
        setUserSwaps(sws);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetId, isPublic, apiUser, me, isMe]);

  useEffect(() => {
    if (showEdit && me && apiUser) {
      setEditForm({
        name: me.name || '',
        bio: me.bio || '',
        phone: me.phone || '',
        gender: apiUser.gender || 'female',
        dob: apiUser.dateOfBirth?.slice(0, 10) || '',
        avatar: me.avatar || '',
      });
    }
  }, [showEdit, me, apiUser]);

  const tabs: { id: Tab; label: string; hidden?: boolean }[] = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'listings', label: isMe ? 'My Listings' : 'Listings' },
      { id: 'history', label: 'Swap History', hidden: !isMe },
      { id: 'reviews', label: 'Reviews' },
    ],
    [isMe]
  );

  if (loading) {
    return (
      <div className="pt-32 flex justify-center text-primary/40">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-32">
        <EmptyState
          title="User not found"
          message="This profile may have been removed."
          actionLabel="Back to browse"
          onAction={() => setLocation('/browse')}
        />
      </div>
    );
  }

  const handleEditSave = async () => {
    setSavingProfile(true);
    try {
      await updateUser({
        name: editForm.name,
        bio: editForm.bio,
        phone: editForm.phone,
        gender: editForm.gender,
        dateOfBirth: editForm.dob || undefined,
      });
      toast('Profile updated.', 'success');
      setShowEdit(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const updated = await usersApi.uploadAvatar(file);
      const next = adaptUser(updated);
      setEditForm((f) => ({ ...f, avatar: next.avatar }));
      setUser(next);
      toast('Avatar updated.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleReport = async () => {
    if (!reportForm.description.trim()) {
      toast('Please describe your concern.', 'error');
      return;
    }
    if (!apiTargetUser) return;
    setSubmittingReport(true);
    try {
      await reportsApi.create({
        reportedUserId: apiTargetUser.id,
        reason: reportForm.reason,
        description: reportForm.description,
      });
      toast('Report submitted. Our team will review it shortly.', 'success');
      setShowReport(false);
      setReportForm({ reason: 'Inappropriate', description: '' });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Submit failed.', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="bg-background relative z-10">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary to-primary/80 text-white pt-20 sm:pt-24 md:pt-28 pb-10 sm:pb-14 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=2000"
            alt=""
            className="w-full h-full object-cover mix-blend-luminosity"
          />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-4 ring-white shadow-lg object-cover"
            />
            <div className="flex-1">
              <h1 className="font-headings text-2xl sm:text-3xl font-bold mb-1">{user.name}</h1>
              {user.bio && (
                <p className="text-white/80 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  {user.bio}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] sm:text-xs text-white/70 font-medium">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {user.location}
                  </span>
                )}
                {user.joined && (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> Joined{' '}
                    {new Date(user.joined).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {isMe ? (
                <button
                  onClick={() => setShowEdit(true)}
                  className="px-4 py-2 rounded-full bg-white text-primary font-bold uppercase tracking-wider text-[11px] hover:scale-105 active:scale-95 shadow-md flex items-center gap-1.5 transition-transform"
                >
                  <Edit size={12} /> Edit
                </button>
              ) : (
                <button
                  onClick={() => setShowReport(true)}
                  className="px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-300/40 text-white font-bold uppercase tracking-wider text-[11px] backdrop-blur flex items-center gap-1.5 transition-colors"
                >
                  <Flag size={12} /> Report
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5 sm:mt-6 max-w-xl">
            {[
              { label: 'Listings', value: user.listingsCount },
              { label: 'Swaps', value: user.swapsCompleted },
              { label: 'Rating', value: user.rating > 0 ? `★ ${user.rating}` : '—' },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-3 py-2.5 text-center"
              >
                <p className="font-headings text-lg sm:text-xl font-bold">{s.value}</p>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/60 font-bold mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-[80px] z-30 bg-background/95 backdrop-blur border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0.5 overflow-x-auto">
            {tabs
              .filter((t) => !t.hidden)
              .map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                    tab === t.id ? 'text-primary' : 'text-primary/50 hover:text-primary/80'
                  }`}
                >
                  {t.label}
                  {tab === t.id && (
                    <motion.div
                      layoutId="profile-tab"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-accent rounded-full"
                    />
                  )}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {tab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 p-5 bg-background shadow-sm">
              <h3 className="font-headings text-base font-bold text-primary mb-3">
                Personal information
              </h3>
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                    Name
                  </dt>
                  <dd className="text-primary font-semibold">{user.name}</dd>
                </div>
                {isMe && (
                  <>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                        Phone
                      </dt>
                      <dd className="text-primary font-semibold">{user.phone || '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                        Date of birth
                      </dt>
                      <dd className="text-primary font-semibold">{user.dob || '—'}</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                    Gender
                  </dt>
                  <dd className="text-primary font-semibold">{user.gender || '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border border-border/60 p-5 bg-background shadow-sm">
              <h3 className="font-headings text-base font-bold text-primary mb-3">Preferences</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Update style preferences in your <Link href="/recommendations" className="text-accent font-bold hover:underline">recommendations preferences</Link> to improve AI matches.
              </p>
            </div>
          </div>
        )}

        {tab === 'listings' && (
          <>
            {items.length === 0 ? (
              <EmptyState
                title={isMe ? 'No listings yet' : 'No active listings'}
                message={
                  isMe
                    ? 'Share your first piece with the community.'
                    : `${user.name.split(' ')[0]} hasn't listed anything yet.`
                }
                actionLabel={isMe ? 'List a piece' : undefined}
                onAction={isMe ? () => setLocation('/items/new') : undefined}
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {items.map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'history' && isMe && (
          <div className="space-y-3">
            {userSwaps.length === 0 ? (
              <EmptyState title="No swaps yet" message="Start by sending a swap request from any item." />
            ) : (
              userSwaps.map((s) => (
                <Link key={s.id} href={`/swaps/${s.id}`}>
                  <div className="rounded-xl border border-border/60 bg-background p-3 hover:border-accent transition-colors cursor-pointer flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                        {s.fromUserId === user.id ? 'You offered' : 'You received'}
                      </p>
                      <p className="font-headings font-bold text-primary text-sm truncate">
                        Swap #{s.id}
                      </p>
                    </div>
                    <Badge
                      color={
                        s.status === 'pending' ? 'amber' :
                        s.status === 'accepted' ? 'green' :
                        s.status === 'completed' ? 'teal' :
                        s.status === 'rejected' ? 'red' : 'gray'
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="space-y-3">
            {userReviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews yet"
                message={`${user.name.split(' ')[0]} will get reviews after completed swaps.`}
              />
            ) : (
              userReviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-border/60 bg-background p-4 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3 mb-0.5">
                      <p className="font-headings font-bold text-primary text-sm">Reviewer #{r.fromUserId}</p>
                      <span className="text-[11px] text-muted-foreground">{r.createdAt}</span>
                    </div>
                    <StarRating value={r.rating} readOnly size={13} />
                    {r.comment && <p className="text-xs text-primary/80 mt-1.5 leading-relaxed italic">"{r.comment}"</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit profile" size="md">
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <img src={editForm.avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-accent/20" />
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">
                Avatar
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleAvatarChange(e.target.files[0])}
              />
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-bold text-accent hover:underline disabled:opacity-60"
              >
                {uploadingAvatar ? 'Uploading…' : 'Change photo'}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-primary/80">Name</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-muted/20 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-primary/80">Bio</label>
            <textarea
              maxLength={500}
              rows={3}
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-muted/20 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-primary/80">Phone</label>
              <input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-muted/20 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-primary/80">Gender</label>
              <select
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as UserType['gender'] extends string ? 'male' | 'female' | 'other' : never })}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-muted/20 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-primary/80">Date of birth</label>
              <input
                type="date"
                value={editForm.dob}
                onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-muted/20 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <button
            onClick={handleEditSave}
            disabled={savingProfile}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-bold uppercase tracking-wider text-xs hover:bg-primary/90 shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {savingProfile && <Loader2 size={14} className="animate-spin" />}
            Save changes
          </button>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal isOpen={showReport} onClose={() => setShowReport(false)} title={`Report ${user.name}`} size="md">
        <div className="space-y-5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-primary/80">Reason</label>
            <select
              value={reportForm.reason}
              onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
              className="w-full mt-2 px-4 py-3 rounded-xl bg-muted/20 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option>Inappropriate</option>
              <option>Fake Listing</option>
              <option>Fraud</option>
              <option>Harassment</option>
              <option>Spam</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-primary/80">
              Tell us more
            </label>
            <textarea
              maxLength={500}
              rows={5}
              value={reportForm.description}
              onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
              placeholder="Describe what happened in detail…"
              className="w-full mt-2 px-4 py-3 rounded-xl bg-muted/20 border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {reportForm.description.length}/500
            </p>
          </div>
          <button
            onClick={handleReport}
            disabled={submittingReport}
            className="w-full py-3.5 rounded-xl bg-red-600 text-white font-bold uppercase tracking-wider text-xs hover:bg-red-700 shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submittingReport && <Loader2 size={14} className="animate-spin" />}
            Submit report
          </button>
        </div>
      </Modal>
    </div>
  );
}
