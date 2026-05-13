import React from 'react';
import { Flag } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Textarea } from '../../../components/ui/Textarea';

export const ProductReportForm = ({ 
  reportForm, 
  setReportForm, 
  onReportSubmit, 
  isPending, 
  hasSeller 
}) => {
  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm animate-fade-up-delayed">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2 text-gray-900">
          <Flag className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-bold">Report Listing or Owner</h3>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Flag misleading, unsafe, abusive, or fraudulent behavior so admin can review it.
        </p>
        <form onSubmit={onReportSubmit} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant={reportForm.targetType === 'product' ? 'primary' : 'outline'}
              onClick={() => setReportForm((prev) => ({ ...prev, targetType: 'product' }))}
            >
              Report Listing
            </Button>
            {hasSeller && (
              <Button
                type="button"
                variant={reportForm.targetType === 'user' ? 'primary' : 'outline'}
                onClick={() => setReportForm((prev) => ({ ...prev, targetType: 'user' }))}
              >
                Report Owner
              </Button>
            )}
          </div>
          <Textarea
            value={reportForm.reason}
            onChange={(e) => setReportForm((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Short reason, for example: spam listing, fake photos, abusive behavior"
            className="min-h-[84px] bg-white"
          />
          <Textarea
            value={reportForm.details}
            onChange={(e) => setReportForm((prev) => ({ ...prev, details: e.target.value }))}
            placeholder="Optional extra details for the admin team"
            className="min-h-[120px] bg-white"
          />
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
