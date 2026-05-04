import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, Clock } from 'lucide-react';

const sessionData = [
  {
    id: 1,
    founderName: 'Priya Sharma',
    startupName: 'FinFlow',
    totalSessions: 10,
    completedSessions: 8,
    upcomingSessions: 2,
    attendance: 95,
    lastSession: '2026-02-25',
    nextSession: '2026-03-05',
  },
  {
    id: 2,
    founderName: 'Anita Desai',
    startupName: 'HealthHub',
    totalSessions: 8,
    completedSessions: 6,
    upcomingSessions: 2,
    attendance: 88,
    lastSession: '2026-02-20',
    nextSession: '2026-03-06',
  },
  {
    id: 3,
    founderName: 'Meera Patel',
    startupName: 'EduConnect',
    totalSessions: 12,
    completedSessions: 11,
    upcomingSessions: 1,
    attendance: 100,
    lastSession: '2026-02-27',
    nextSession: '2026-03-07',
  },
  {
    id: 4,
    founderName: 'Kavya Reddy',
    startupName: 'ShopEase',
    totalSessions: 6,
    completedSessions: 3,
    upcomingSessions: 3,
    attendance: 67,
    lastSession: '2026-02-15',
    nextSession: '2026-03-08',
  },
  {
    id: 5,
    founderName: 'Sneha Iyer',
    startupName: 'GreenTech Solutions',
    totalSessions: 15,
    completedSessions: 14,
    upcomingSessions: 1,
    attendance: 97,
    lastSession: '2026-02-26',
    nextSession: '2026-03-10',
  },
  {
    id: 6,
    founderName: 'Radhika Singh',
    startupName: 'AgriGrow',
    totalSessions: 7,
    completedSessions: 5,
    upcomingSessions: 2,
    attendance: 85,
    lastSession: '2026-02-22',
    nextSession: '2026-03-09',
  },
];

export default function SessionTracking() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-black">Session Tracking</h1>
        <p className="text-muted-foreground mt-1">
          Monitor session progress for all founders
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-[#6C63FF]/10 to-[#6C63FF]/5">
          <p className="text-sm text-muted-foreground mb-1 text-black">Total Sessions</p>
          <p className="text-3xl font-semibold text-[#6C63FF]">58</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#50E3C2]/10 to-[#50E3C2]/5">
          <p className="text-sm text-muted-foreground mb-1 text-black">Completed</p>
          <p className="text-3xl font-semibold text-[#50E3C2]">47</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#FFA94D]/10 to-[#FFA94D]/5">
          <p className="text-sm text-muted-foreground mb-1 text-black">Upcoming</p>
          <p className="text-3xl font-semibold text-[#FFA94D]">11</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#A78BFA]/10 to-[#A78BFA]/5">
          <p className="text-sm text-muted-foreground mb-1 text-black">Avg Attendance</p>
          <p className="text-3xl font-semibold text-[#A78BFA]">88%</p>
        </Card>
      </div>

      {/* Session Tracking Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sessionData.map((founder) => {
          const progress =
            (founder.completedSessions / founder.totalSessions) * 100;

          return (
            <Card key={founder.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4 text-black">
                <div>
                  <h3 className="font-semibold text-lg text-black">
                    {founder.founderName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {founder.startupName}
                  </p>
                </div>
                <Badge
                  className={`${
                    founder.attendance >= 90
                      ? 'bg-[#50E3C2]/10 text-[#50E3C2] border-[#50E3C2]/20'
                      : founder.attendance >= 75
                      ? 'bg-[#FFA94D]/10 text-[#FFA94D] border-[#FFA94D]/20'
                      : 'bg-[#FF6B9D]/10 text-[#FF6B9D] border-[#FF6B9D]/20'
                  } border`}
                >
                  {founder.attendance}% Attendance
                </Badge>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2 text-black">
                  <span className="text-muted-foreground">
                    Session Progress
                  </span>
                  <span className="font-medium">
                    {founder.completedSessions}/{founder.totalSessions} Completed
                  </span>
                </div>
                <Progress
  value={progress}
  className="h-2 bg-gray-200 [&>div]:bg-black"
/>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-xl bg-[#6C63FF]/5">
                  <p className="text-2xl font-semibold text-[#6C63FF]">
                    {founder.totalSessions}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[#50E3C2]/5">
                  <p className="text-2xl font-semibold text-[#50E3C2]">
                    {founder.completedSessions}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Completed
                  </p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[#FFA94D]/5">
                  <p className="text-2xl font-semibold text-[#FFA94D]">
                    {founder.upcomingSessions}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upcoming
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-black">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-[#50E3C2]" />
                    Last Session
                  </div>
                  <span className="font-medium">
                    {new Date(founder.lastSession).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-black">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-[#6C63FF]" />
                    Next Session
                  </div>
                  <span className="font-medium">
                    {new Date(founder.nextSession).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}