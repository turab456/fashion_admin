import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Star, MessageSquare, ShieldCheck, ShieldAlert, CornerDownRight, X } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Moderation / Reply drawer state
  const [selectedReview, setSelectedReview] = useState(null);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      setLoading(true);
      const res = await api.reviews.listAdmin();
      setReviews(res.data || []);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleModerate = async (reviewId, newStatus) => {
    if (!window.confirm(`Mark this review as ${newStatus}?`)) return;
    try {
      await api.reviews.moderate(reviewId, newStatus);
      alert(`Review marked as: ${newStatus}`);
      loadReviews();
      if (selectedReview && selectedReview._id === reviewId) {
        setSelectedReview({ ...selectedReview, status: newStatus });
      }
    } catch (err) {
      alert(err.message || "Failed to moderate review.");
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await api.reviews.reply(selectedReview._id, replyText);
      alert("Reply submitted successfully!");
      setReplyText("");
      setIsReplyOpen(false);
      loadReviews();
    } catch (err) {
      alert(err.message || "Failed to submit reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved": return <Badge variant="success">Approved</Badge>;
      case "Pending": return <Badge variant="warning">Pending</Badge>;
      case "Spam": return <Badge variant="secondary">Spam</Badge>;
      default: return <Badge variant="danger">Rejected</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Review Logs"
        subtitle="Customer Feedback Moderation"
      />

      {/* Reviews Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="text-center text-xs uppercase tracking-widest text-text-secondary py-20 select-none">
            Loading feedback logs...
          </div>
        ) : reviews.length > 0 ? (
          <Table className="border-0 rounded-none">
            <TableHeader>
              <TableHead>Target Product</TableHead>
              <TableHead>Reviewer / Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {reviews.map((rev) => (
                <TableRow key={rev._id}>
                  <TableCell>
                    <p className="font-semibold text-text-primary uppercase tracking-wide text-[13px]">
                      {rev.product?.name || "Garment"}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1 uppercase font-mono tracking-wider">
                      SKU: {rev.product?.sku || "N/A"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-text-secondary text-[13px]">{rev.user?.name || "Anonymous"}</p>
                    <div className="flex text-accent mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < rev.rating ? "fill-[#d4af37] text-[#d4af37]" : "text-border-custom"}`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-[13px] text-text-secondary max-w-sm tracking-wider font-light line-clamp-2">
                      {rev.comment}
                    </p>
                    {rev.replies && rev.replies.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-accent mt-2 uppercase tracking-widest font-semibold">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>Replied</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(rev.status)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReview(rev);
                          setIsReplyOpen(true);
                        }}
                        title="Reply / Moderate"
                        className="text-xs uppercase tracking-wider"
                      >
                        <MessageSquare size={14} className="mr-1.5" />
                        Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-20 text-xs uppercase tracking-widest text-text-muted">
            No customer reviews registered in the system.
          </div>
        )}
      </Card>

      {/* DETAIL MODAL WITH REPLY FORM */}
      <Modal
        isOpen={isReplyOpen && !!selectedReview}
        onClose={() => setIsReplyOpen(false)}
        title="Review Moderation"
        maxWidth="max-w-2xl"
      >
        {selectedReview && (
          <div className="space-y-6">
            <span className="text-[10px] uppercase tracking-widest text-accent font-semibold block -mt-4 mb-4">
              Product: {selectedReview.product?.name}
            </span>

            {/* Customer Review snippet */}
            <div className="bg-gray-50 p-5 border border-border-custom rounded space-y-3">
              <div className="flex justify-between items-center text-[13px]">
                <span className="font-semibold text-text-primary uppercase">{selectedReview.user?.name}</span>
                <div className="flex text-accent">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < selectedReview.rating ? "fill-[#d4af37] text-[#d4af37]" : "text-border-custom"}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed tracking-wider font-light">
                "{selectedReview.comment}"
              </p>
              <div className="flex gap-2 items-center pt-2">
                <span className="text-[10px] text-text-muted uppercase font-semibold">Status:</span>
                {getStatusBadge(selectedReview.status)}
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              <label className="text-[10px] text-text-muted uppercase font-semibold mb-2 block tracking-wider">Set Approval Status</label>
              <div className="grid grid-cols-3 gap-3 select-none">
                <Button
                  onClick={() => handleModerate(selectedReview._id, "Approved")}
                  disabled={selectedReview.status === "Approved"}
                  variant={selectedReview.status === "Approved" ? "success" : "success-outline"}
                  className="w-full py-2.5 text-[10px] uppercase tracking-widest font-semibold"
                >
                  Approve Review
                </Button>
                <Button
                  onClick={() => handleModerate(selectedReview._id, "Rejected")}
                  disabled={selectedReview.status === "Rejected"}
                  variant={selectedReview.status === "Rejected" ? "danger" : "danger-outline"}
                  className="w-full py-2.5 text-[10px] uppercase tracking-widest font-semibold"
                >
                  Reject Review
                </Button>
                <Button
                  onClick={() => handleModerate(selectedReview._id, "Spam")}
                  disabled={selectedReview.status === "Spam"}
                  variant={selectedReview.status === "Spam" ? "secondary" : "outline"}
                  className="w-full py-2.5 text-[10px] uppercase tracking-widest font-semibold"
                >
                  Mark Spam
                </Button>
              </div>
            </div>

            {/* Replies History */}
            {selectedReview.replies && selectedReview.replies.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest font-semibold text-text-primary">
                  Previous Responses
                </h4>
                <div className="space-y-3 border-l-2 border-accent pl-4 py-1">
                  {selectedReview.replies.map((rep, idx) => (
                    <div key={idx} className="text-[13px] space-y-1 bg-gray-50 p-3 rounded border border-border-custom">
                      <p className="font-semibold text-accent uppercase text-xs">AURA Admin Team</p>
                      <p className="text-text-secondary font-light">{rep.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Reply Form */}
            <form onSubmit={handleReplySubmit} className="space-y-4 pt-4 border-t border-border-custom">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-text-muted uppercase font-semibold tracking-wider">Official Response</label>
                <textarea
                  required
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="E.g., Thank you for your feedback. We carry dry clean cashmere care instructions..."
                  className="w-full bg-white border border-border-custom rounded p-3 text-sm focus:outline-none focus:border-accent font-light"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsReplyOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submittingReply}
                  className="px-6"
                >
                  {submittingReply ? "Submitting..." : "Publish Reply"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
