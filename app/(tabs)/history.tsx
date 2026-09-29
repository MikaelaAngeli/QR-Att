import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getTeacherEventAttendance, type TeacherEventAttendance } from '@/lib/attendance';
import { getAttendanceHistory, type AttendanceRecord } from '@/lib/database';
import { getProfile, type Role } from '@/lib/profiles';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<TeacherEventAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const profile = await getProfile(user.id);
    const currentRole = profile?.role ?? 'student';
    setRole(currentRole);

    if (currentRole === 'teacher') {
      setTeacherEvents(await getTeacherEventAttendance(user.id));
      setStudentRecords([]);
    } else {
      setStudentRecords(await getAttendanceHistory(user.id));
      setTeacherEvents([]);
    }
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  if (loading) {
    return <StateView text="Loading attendance..." />;
  }

  if (role === 'teacher') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>My Event Attendance</Text>
        {teacherEvents.length === 0 ? (
          <StateView text="No events yet. Create an event from the Teacher tab." />
        ) : (
          <FlatList
            data={teacherEvents}
            keyExtractor={(item) => item.eventId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <TeacherEventCard event={item} />}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance History</Text>
      {studentRecords.length === 0 ? (
        <StateView text="No records yet. Scan a QR code to register your attendance." />
      ) : (
        <FlatList
          data={studentRecords}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.eventTitle}>{item.eventTitle}</Text>
              <Text style={styles.eventMeta}>{item.eventId}</Text>
              <Text style={styles.eventMeta}>{formatDate(item.scannedAt)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function TeacherEventCard({ event }: { event: TeacherEventAttendance }) {
  return (
    <View style={styles.card}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.countBadge}>{event.attendeeCount} attended</Text>
      </View>
      <Text style={styles.eventMeta}>{event.eventCode}</Text>
      {event.startTime && (
        <Text style={styles.eventMeta}>Starts: {formatDate(event.startTime)}</Text>
      )}
      {event.attendees.length === 0 ? (
        <Text style={styles.emptyAttendees}>No scans yet.</Text>
      ) : (
        event.attendees.map((attendee) => (
          <View key={`${attendee.studentId}-${attendee.scannedAt}`} style={styles.attendeeRow}>
            <Text style={styles.attendeeName}>
              {attendee.studentName || shortId(attendee.studentId)}
            </Text>
            <Text style={styles.eventMeta}>{formatDate(attendee.scannedAt)}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function StateView({ text }: { text: string }) {
  return (
    <View style={styles.stateContainer}>
      <Text style={styles.subtitle}>{text}</Text>
    </View>
  );
}

function shortId(id: string) {
  return id ? `...${id.slice(-8)}` : 'unknown';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  stateContainer: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: COLORS.background,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 32,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#EAF4EF',
    color: '#2E7D32',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  attendeeRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 10,
    paddingTop: 8,
  },
  attendeeName: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  emptyAttendees: {
    color: COLORS.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
  },
});
