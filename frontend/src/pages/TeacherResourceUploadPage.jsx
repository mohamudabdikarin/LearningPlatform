import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { Upload, File, Video, Image, FileText, Music, Trash2, Download, Eye, Plus, FolderOpen } from 'lucide-react';

const TeacherResourceUploadPage = () => {
  const { user } = useAuth();
  const { darkMode } = useDarkMode();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch teacher's courses
  useEffect(() => {
    if (!user) return;
    setCoursesLoading(true);
    setCoursesError('');
    apiFetch(`/courses/instructor/${user.id}`)
      .then((data) => {
        setCourses(data);
        if (data.length === 1) setSelectedCourseId(data[0].id);
      })
      .catch(() => setCoursesError('Failed to load your courses.'))
      .finally(() => setCoursesLoading(false));
  }, [user]);

  // Fetch all resources for this course
  const fetchResources = async (courseId) => {
    if (!courseId) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/courses/${courseId}/resources`);
      setResources(res);
    } catch (e) {
      setError('Failed to load resources.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedCourseId) fetchResources(selectedCourseId);
  }, [selectedCourseId]);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFilesUpload(files);
    }
  };

  // Handle multiple files upload (used by both drag-drop and file input)
  const handleFilesUpload = async (files) => {
    if (!files.length || !selectedCourseId) {
      setError('Please select files and a course.');
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to upload files.');
      return;
    }

    setUploading(true);
        setError('');
    setSuccess('');

    try {
      let successCount = 0;
      let failCount = 0;
      const failedFiles = [];

      for (const file of files) {
        try {
          console.log(`Uploading file: ${file.name}`);

          const formData = new FormData();
          formData.append('file', file);

          // Upload file
          const uploadResponse = await apiFetch('/upload', {
            method: 'POST',
            body: formData,
            headers: {}, // Let browser set Content-Type for FormData
          });

          console.log('Upload response:', uploadResponse);

          if (uploadResponse && uploadResponse.url) {
            console.log(`File uploaded successfully: ${uploadResponse.url}`);

            // Save resource to backend
            const resourceResponse = await apiFetch(`/courses/${selectedCourseId}/resources`, {
              method: 'POST',
              body: JSON.stringify({
                filePath: uploadResponse.url
              }),
            });

            console.log('Resource saved:', resourceResponse);
            successCount++;
          } else {
            console.error('No URL returned from upload');
            failCount++;
            failedFiles.push(file.name);
          }
        } catch (e) {
          console.error('Failed to upload file:', file.name, e);
          failCount++;
          failedFiles.push(file.name);

          // If it's an authentication error, show specific message
          if (e.message.includes('401') || e.message.includes('403') || e.message.includes('Unauthorized')) {
            setError('Authentication failed. Please log in again.');
            return;
          }
        }
      }

      if (successCount > 0) {
        setSuccess(`Successfully uploaded ${successCount} file(s)${failCount > 0 ? `. Failed: ${failedFiles.join(', ')}` : '!'}`);
        await fetchResources(selectedCourseId);
      } else {
        setError(`All uploads failed. Files: ${failedFiles.join(', ')}`);
      }
    } catch (e) {
      console.error('Upload error:', e);
      setError(e.message || 'Failed to upload resources.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file upload (supports multiple files)
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    handleFilesUpload(files);
  };

  // Delete a resource
  const handleDelete = async (resourceId) => {
    setDeleteLoading(resourceId);
    try {
      await apiFetch(`/courses/resources/${resourceId}`, { method: 'DELETE' });
      setResources(resources.filter(r => r.id !== resourceId));
      setSuccess('Resource deleted successfully!');
    } catch (e) {
      setError('Failed to delete resource.');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Helper: get file type icon
  const getFileTypeIcon = (fileName, fileType) => {
    const type = fileType || fileName?.split('.').pop()?.toLowerCase() || '';

    if (type.match(/pdf/i)) return <FileText className="w-6 h-6 text-red-500" />;
    if (type.match(/mp4|mov|avi|webm|video/i)) return <Video className="w-6 h-6 text-purple-500" />;
    if (type.match(/jpg|jpeg|png|gif|webp|image/i)) return <Image className="w-6 h-6 text-green-500" />;
    if (type.match(/mp3|wav|audio/i)) return <Music className="w-6 h-6 text-blue-500" />;
    return <File className="w-6 h-6 text-gray-500" />;
  };

  // Helper: format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!user) return <div className="p-8 text-center">Login required.</div>;

    return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Course Resources</h1>
          <p className="text-gray-600 dark:text-gray-400">Upload and manage learning materials for your courses</p>
        </div>

        {/* Course Selection */}
        {coursesLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading your courses...</span>
          </div>
        ) : coursesError ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {coursesError}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses found</h3>
            <p className="text-gray-600 dark:text-gray-400">Create a course first to upload resources.</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
              <label className="block text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                Select Course
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
              >
                <option value="">-- Select a course --</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            {selectedCourseId && (
              <>
                {/* Upload Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload New Resource</h2>

                  {/* Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragActive
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
                      } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {uploading ? 'Uploading...' : 'Upload Resources'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {uploading
                        ? 'Please wait while files are being uploaded...'
                        : 'Drag and drop multiple files here, or click to browse'
                      }
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Supported formats: PDF, DOC, PPT, MP4, MP3, Images, ZIP
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.avi,.mp3,.wav,.jpg,.jpeg,.png,.gif,.zip,.rar"
                    />
                    {!uploading && (
                      <button
                        type="button"
                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                      >
                        Choose Files
                      </button>
                    )}
                    {uploading && (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
                        <span className="text-indigo-600 font-medium">Processing files...</span>
                      </div>
                    )}
                  </div>

                  {/* Status Messages */}
                  {success && (
                    <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
                      {success}
                    </div>
                  )}
                  {error && (
                    <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}
                </div>

                {/* Resources List */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Course Resources</h2>

                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      <span className="ml-3 text-gray-600 dark:text-gray-400">Loading resources...</span>
                    </div>
                  ) : resources.length === 0 ? (
                    <div className="text-center py-12">
                      <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No resources yet</h3>
                      <p className="text-gray-600 dark:text-gray-400">Upload your first resource to get started.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {resources.map(resource => (
                        <div key={resource.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-center space-x-4">
                            {getFileTypeIcon(resource.fileName, resource.fileType)}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                                {resource.fileName}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {resource.fileType} • Uploaded recently
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {resource.fileUrl && (
                              <a
                                href={resource.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                title="View/Download"
                              >
                                <Eye className="w-5 h-5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDelete(resource.id)}
                              disabled={deleteLoading === resource.id}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete"
                            >
                              {deleteLoading === resource.id ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                </div>
          )}
        </div>
              </>
            )}
          </>
      )}
      </div>
        </div>
    );
};

export default TeacherResourceUploadPage; 