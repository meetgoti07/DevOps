"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  UserPlus,
  Edit,
  Shield,
  ShieldCheck,
  Phone,
} from "lucide-react";
import { User } from "@/lib/types";
import { toast } from "sonner";

// Mock user data since we don't have a user management API endpoint
const mockUsers: User[] = [
  {
    id: 1,
    email: "admin@canteen.com",
    fullName: "Admin User",
    phone: "+1234567890",
    role: "ADMIN",
  },
  {
    id: 2,
    email: "staff@canteen.com",
    fullName: "Staff Member",
    phone: "+1234567891",
    role: "STAFF",
  },
  {
    id: 3,
    email: "john.doe@student.edu",
    fullName: "John Doe",
    phone: "+1234567892",
    role: "CUSTOMER",
  },
  // Add more mock users...
];

const getRoleColor = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "STAFF":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "CUSTOMER":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let filtered = users || [];

    // Filter by role
    if (selectedRole !== "all") {
      filtered = filtered.filter((user) => user.role === selectedRole);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [users, selectedRole, searchTerm]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      // In a real app, this would call an API endpoint
      setUsers((prev) =>
        (prev || []).map((user) =>
          user.id === userId
            ? {
                ...user,
                role: newRole as any,
              }
            : user
        )
      );

      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error("Failed to update user role");
      console.error("Error updating user role:", error);
    }
  };

  const getUserStats = () => {
    return {
      total: (users || []).length,
      admins: (users || []).filter((user) => user.role === "ADMIN").length,
      staff: (users || []).filter((user) => user.role === "STAFF").length,
      customers: (users || []).filter((user) => user.role === "CUSTOMER")
        .length,
    };
  };

  const stats = getUserStats();

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <div className="page-container">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="page-container">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage user accounts and permissions
              </p>
            </div>

            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">{stats.admins}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Staff</p>
                  <p className="text-2xl font-bold">{stats.staff}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Customers</p>
                  <p className="text-2xl font-bold">{stats.customers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="all">All Roles</option>
            <option value="ADMIN">Admins</option>
            <option value="STAFF">Staff</option>
            <option value="CUSTOMER">Customers</option>
          </select>

          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </Button>
        </div>

        {/* Users List */}
        {(filteredUsers || []).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No users found
              </h3>
              <p className="text-gray-500 text-center">
                {searchTerm || selectedRole !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No users available"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(filteredUsers || []).map((user) => (
              <Card
                key={user.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {user.fullName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg">
                          {user.fullName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {user.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>

                      <div className="flex gap-2">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                          className="px-2 py-1 text-sm border border-input rounded bg-background"
                        >
                          <option value="CUSTOMER">Customer</option>
                          <option value="STAFF">Staff</option>
                          <option value="ADMIN">Admin</option>
                        </select>

                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
