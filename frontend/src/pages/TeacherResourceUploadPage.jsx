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
  const [videoModalUrl, setVideoModalUrl] = useState(null);
  const videoModalRef = useRef();
  const [fileModal, setFileModal] = useState({ url: null, type: null, name: null });
  const fileModalRef = useRef();

  // Close modal on ESC
  useEffect(() => {
      if (!videoModalUrl && !fileModal.url) return;
      const handleKeyDown = (e) => {
          if (e.key === 'Escape') {
              setVideoModalUrl(null);
              setFileModal({ url: null, type: null, name: null });
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [videoModalUrl, fileModal.url]);

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
    setError("");
    setSuccess("");
    try {
        await apiFetch(`/courses/resources/${resourceId}`, { method: 'DELETE' });
        setResources(prev => prev.filter(r => r.id !== resourceId));
        setSuccess('Resource deleted successfully!');
    } catch (e) {
        // Double check if resource is gone after error (race condition)
        setLoading(true);
        try {
            const refreshed = await apiFetch(`/courses/${selectedCourseId}/resources`);
            setResources(refreshed);
            if (!refreshed.find(r => r.id === resourceId)) {
                setSuccess('Resource deleted successfully!');
                setError("");
            } else {
                setError('Failed to delete resource.');
            }
        } catch (refreshErr) {
            setError('Failed to delete resource.');
        } finally {
            setLoading(false);
        }
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                    <label className="block text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                        Select Course
                    </label>
                    <div className="flex items-center gap-4">
                        <select
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-base shadow-sm appearance-none transition-colors"
                            value={selectedCourseId}
                            onChange={e => setSelectedCourseId(e.target.value)}
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg fill=\'none\' stroke=\'%23647bba\' stroke-width=\'2\' viewBox=\'0 0 24 24\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                        >
                            <option value="" className="text-gray-400">-- Select a course --</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id} className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-800">
                                    {course.title}
                                </option>
                            ))}
                        </select>
                        {selectedCourseId && (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="hidden"
                                    multiple
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.avi,.mp3,.wav,.jpg,.jpeg,.png,.gif,.zip,.rar"
                                />
                                <button
                                    type="button"
                                    onClick={() => !uploading && fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors text-base  sm:w-auto"
                                >
                                    {uploading ? 'Uploading...' : 'Add'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Resources List FIRST */}
            {selectedCourseId && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Course Resources</h2>
                        <div>
                            {/* The Add Resource button and file input are now inside the Select Course section */}
                        </div>
                    </div>
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
                                <div key={resource.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                                        <div className="flex-shrink-0 flex items-center justify-center mb-2 sm:mb-0">
                                            {getFileTypeIcon(resource.fileName, resource.fileType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white truncate">
                                                {resource.fileName}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                {resource.fileType} • Uploaded recently
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-row sm:flex-col gap-2 sm:gap-2 items-center sm:items-end mt-2 sm:mt-0">
                                        {resource.fileUrl && (resource.fileType?.match(/mp4|mov|avi|webm|video/i) || resource.fileName?.match(/\.(mp4|mov|avi|webm)$/i)) ? (
                                            <button
                                                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                title="View Video"
                                                onClick={() => setVideoModalUrl(resource.fileUrl)}
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        ) : resource.fileUrl && (
                                            <button
                                                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                                title="View File"
                                                onClick={() => setFileModal({ url: resource.fileUrl, type: resource.fileType || resource.fileName, name: resource.fileName })}
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
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
                    {success && <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg w-full text-center">{success}</div>}
                    {error && <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg w-full text-center">{error}</div>}
                </div>
            )}
          </>
      )}
      {/* Video Modal */}
      {videoModalUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
              {/* Overlay */}
              <div className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={() => setVideoModalUrl(null)} />
              {/* Modal Content */}
              <div
                  ref={videoModalRef}
                  className="relative bg-white dark:bg-gray-900 shadow-2xl w-full max-w-full sm:max-w-2xl mx-auto p-0 flex flex-col z-50"
                  style={{ maxHeight: '95vh' }}
                  onClick={e => e.stopPropagation()}
                  tabIndex={-1}
              >
                  <button
                      className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl bg-white/80 dark:bg-gray-900/80 rounded-full p-1 shadow focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      onClick={() => setVideoModalUrl(null)}
                      aria-label="Close"
                      style={{ lineHeight: 1 }}
                  >
                      &times;
                  </button>
                  <div className="flex-1 flex items-center justify-center p-1 sm:p-4 overflow-auto w-full">
                      <div className="w-full aspect-w-16 aspect-h-9 bg-black flex items-center justify-center">
                          <video
                              src={videoModalUrl}
                              controls
                              autoPlay
                              className="w-full h-full object-contain bg-black"
                              style={{ background: '#000', borderRadius: 0 }}
                              controlsList="nodownload"
                          >
                              Sorry, your browser does not support embedded videos.
                          </video>
                      </div>
                  </div>
              </div>
          </div>
      )}
      {/* File Preview Modal (non-video) */}
      {fileModal.url && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
              {/* Overlay */}
              <div className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={() => setFileModal({ url: null, type: null, name: null })} />
              {/* Modal Content */}
              <div
                  ref={fileModalRef}
                  className="relative bg-white dark:bg-gray-900 shadow-2xl w-full max-w-full sm:max-w-2xl mx-auto p-0 flex flex-col z-50"
                  style={{ maxHeight: '95vh' }}
                  onClick={e => e.stopPropagation()}
                  tabIndex={-1}
              >
                  <button
                      className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl bg-white/80 dark:bg-gray-900/80 rounded-full p-1 shadow focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      onClick={() => setFileModal({ url: null, type: null, name: null })}
                      aria-label="Close"
                      style={{ lineHeight: 1 }}
                  >
                      &times;
                  </button>
                  <div className="flex flex-col items-center justify-center p-2 sm:p-6 overflow-auto w-full h-full">
                      <div className="w-full flex flex-col items-center gap-2">
                          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                              <span className="text-base font-semibold text-gray-900 dark:text-white truncate" title={fileModal.name}>{fileModal.name}</span>
                              <a
                                  href={fileModal.url}
                                  download={fileModal.name}
                                  className="inline-block px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm w-full sm:w-auto text-center"
                              >
                                  Download
                              </a>
                          </div>
                          {/* PDF */}
                          {fileModal.type.match(/pdf/i) ? (
                              <iframe
                                  src={fileModal.url}
                                  title={fileModal.name}
                                  className="w-full h-[60vh] bg-gray-100 dark:bg-gray-800 rounded-lg"
                                  style={{ minHeight: '300px', border: 'none' }}
                                  allowFullScreen
                              />
                          ) : /* Image */ fileModal.type.match(/jpg|jpeg|png|gif|webp|image/i) ? (
                              <img
                                  src={fileModal.url}
                                  alt={fileModal.name}
                                  className="max-w-full max-h-[60vh] object-contain bg-black rounded-lg"
                              />
                          ) : /* Audio */ fileModal.type.match(/mp3|wav|audio/i) ? (
                              <audio
                                  src={fileModal.url}
                                  controls
                                  className="w-full"
                              >
                                  Your browser does not support the audio element.
                              </audio>
                          ) : /* Fallback */ (
                              <div className="w-full text-center p-6">
                                  <p className="text-gray-700 dark:text-gray-100 mb-4">Preview not supported for this file type.</p>
                                  <a
                                      href={fileModal.url}
                                      download={fileModal.name}
                                      className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto text-center"
                                  >
                                      Download File
                                  </a>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
      </div>
        </div>
    );
};

export default TeacherResourceUploadPage; 