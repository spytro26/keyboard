import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/AuthProvider';
import { useStorageContext } from '@/hooks/StorageProvider';

export default function ProfileTab() {
  const { user, userProfile, isGuestMode, signOut, deleteUserAccount, saveGuestInputs } = useAuth();
  const { roomData, productData, miscData } = useStorageContext();
  const [isDeleting, setIsDeleting] = useState(false);

  // If user is not logged in (guest mode), show sign in prompt
  if (!user) {
    const handleSignUpToView = async () => {
      // Save current inputs before navigating to signup
      await saveGuestInputs({ roomData, productData, miscData });
      router.push('/sign-up' as any);
    };

    const handleSignInToView = async () => {
      // Save current inputs before navigating to signin
      await saveGuestInputs({ roomData, productData, miscData });
      router.push('/sign-in' as any);
    };

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>Sign in to view your profile</Text>
            </View>

            <View style={styles.guestPromptCard}>
              <Ionicons name="person-circle-outline" size={80} color="#94a3b8" />
              <Text style={styles.guestTitle}>Guest Mode</Text>
              <Text style={styles.guestText}>
                You are currently using the app without an account. Sign in or create an account to save your calculations and access your profile.
              </Text>
              
              <TouchableOpacity style={styles.signUpButton} onPress={handleSignUpToView}>
                <Text style={styles.signUpButtonText}>Create Account</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.signInButton} onPress={handleSignInToView}>
                <Text style={styles.signInButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // User is logged in - show profile
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/sign-in' as any);
          }
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const success = await deleteUserAccount();
            setIsDeleting(false);
            
            if (success) {
              Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
              router.replace('/sign-in' as any);
            } else {
              Alert.alert(
                'Delete Failed', 
                'Failed to delete your account. You may need to sign in again before deleting. Please try signing out and back in first.'
              );
            }
          }
        },
      ]
    );
  };

  const ProfileField = ({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) => (
    <View style={styles.profileField}>
      <View style={styles.fieldIcon}>
        <Ionicons name={icon} size={20} color="#2563eb" />
      </View>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'end_user': return 'End User';
      case 'system_integrator': return 'System Integrator';
      case 'oem': return 'OEM';
      case 'other': return 'Other';
      default: return type || 'Not specified';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Your account information</Text>
          </View>

          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <Text style={styles.userName}>{userProfile?.name || 'User'}</Text>
          </View>

          {/* Profile Information */}
          <View style={styles.profileCard}>
            <ProfileField 
              label="Full Name" 
              value={userProfile?.name || ''} 
              icon="person-outline" 
            />
            <ProfileField 
              label="Email" 
              value={userProfile?.email || ''} 
              icon="mail-outline" 
            />
            <ProfileField 
              label="Phone" 
              value={userProfile?.phone || ''} 
              icon="call-outline" 
            />
            <ProfileField 
              label="Company" 
              value={userProfile?.company || ''} 
              icon="business-outline" 
            />
            <ProfileField 
              label="City" 
              value={userProfile?.city || ''} 
              icon="location-outline" 
            />
            <ProfileField 
              label="User Type" 
              value={getUserTypeLabel(userProfile?.userType || '')} 
              icon="briefcase-outline" 
            />
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#ffffff" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>

          {/* Delete Account Button - Small and subtle */}
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by Enzo</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '400',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '400',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  // Guest mode styles
  guestPromptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  guestText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  signUpButton: {
    width: '100%',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
});
