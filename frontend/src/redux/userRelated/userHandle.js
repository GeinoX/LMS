import axios from 'axios';
import {
    authRequest,
    stuffAdded,
    authSuccess,
    authFailed,
    authError,
    authLogout,
    doneSuccess,
    getRequest,
    getFailed,
    getError,
} from './userSlice';

export const loginUser = (fields, role) => async (dispatch) => {
    console.log('🔑 LOGIN ATTEMPT: Starting login process');
    console.log('🔑 LOGIN ATTEMPT: Role:', role);
    console.log('🔑 LOGIN ATTEMPT: Fields:', fields);
    dispatch(authRequest());

    try {
        console.log('🔑 LOGIN ATTEMPT: Making API call to server');
        const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/${role}Login`, fields, {
            headers: { 'Content-Type': 'application/json' },
        });
        console.log('🔑 LOGIN ATTEMPT: Server response:', result.data);
        if (result.data.role) {
            console.log('🔑 LOGIN ATTEMPT: Login successful, dispatching authSuccess');
            dispatch(authSuccess(result.data));
        } else {
            console.log('🔑 LOGIN ATTEMPT: Login failed - no role in response');
            dispatch(authFailed(result.data.message));
        }
    } catch (error) {
        console.error('🔑 LOGIN ATTEMPT: Login error:', error);
        dispatch(authError(error));
    }
};

export const registerUser = (fields, role) => async (dispatch) => {
    dispatch(authRequest());

    try {
        const result = await axios.post(`${process.env.REACT_APP_BASE_URL}/${role}Reg`, fields, {
            headers: { 'Content-Type': 'application/json' },
        });
        if (result.data.schoolName) {
            dispatch(authSuccess(result.data));
        }
        else if (result.data.school) {
            dispatch(stuffAdded(result.data));
        }
        else {
            dispatch(authFailed(result.data.message));
        }
    } catch (error) {
        dispatch(authError(error));
    }
};

export const logoutUser = () => (dispatch) => {
    dispatch(authLogout());
};

export const getUserDetails = (id, address) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.get(`${process.env.REACT_APP_BASE_URL}/${address}/${id}`);
        if (result.data) {
            dispatch(doneSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error));
    }
};

export const deleteUser = (id, address) => async (dispatch) => {
    dispatch(getRequest());
    dispatch(getFailed("Sorry the delete function has been disabled for now."));
};

export const updateUser = (fields, id, address) => async (dispatch) => {
    dispatch(getRequest());

    try {
        const result = await axios.put(`${process.env.REACT_APP_BASE_URL}/${address}/${id}`, fields, {
            headers: { 'Content-Type': 'application/json' },
        });
        if (result.data.schoolName) {
            dispatch(authSuccess(result.data));
        }
        else {
            dispatch(doneSuccess(result.data));
        }
    } catch (error) {
        dispatch(getError(error));
    }
};

export const addStuff = (fields, address) => async (dispatch) => {
    dispatch(authRequest());

    try {
        console.log('🚀 === ADD STUFF REQUEST ===');
        console.log('📝 Address:', `${process.env.REACT_APP_BASE_URL}/${address}Create`);
        console.log('📦 Fields type:', fields instanceof FormData ? 'FormData' : 'Object');
        
        // Check if base URL is set
        if (!process.env.REACT_APP_BASE_URL) {
            throw new Error('REACT_APP_BASE_URL environment variable is not set');
        }

        let config;
        let dataToSend = fields;

        if (fields instanceof FormData) {
            config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 30000, // 30 seconds timeout
                maxContentLength: 100 * 1024 * 1024, // 100MB max
                maxBodyLength: 100 * 1024 * 1024, // 100MB max
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        console.log(`📤 Upload progress: ${progress}%`);
                    }
                }
            };
            
            console.log('📋 FormData content:');
            for (let [key, value] of fields.entries()) {
                if (value instanceof File) {
                    console.log(`   ${key}: File - ${value.name} (${value.size} bytes)`);
                } else if (key === 'subjects') {
                    try {
                        const subjectsData = JSON.parse(value);
                        console.log(`   ${key}:`, subjectsData);
                    } catch {
                        console.log(`   ${key}:`, value);
                    }
                } else {
                    console.log(`   ${key}:`, value);
                }
            }
        } else {
            config = {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            };
            console.log('📄 JSON data:', fields);
        }

        console.log('⏳ Sending request to server...');
        
        const result = await axios.post(
            `${process.env.REACT_APP_BASE_URL}/${address}Create`,
            dataToSend,
            config
        );

        console.log('✅ Response received:', result.data);

        // Improved response handling
        if (result.data) {
            if (result.data.success === false) {
                console.log('❌ Server reported failure:', result.data.message);
                dispatch(authFailed(result.data.message || 'Operation failed'));
            } else {
                // Consider any response with data as success
                console.log('🎉 Success: Operation completed');
                dispatch(stuffAdded(result.data));
            }
        } else {
            console.log('❌ Empty response from server');
            dispatch(authFailed('Empty response from server'));
        }
        
    } catch (error) {
        console.error('💥 === ADD STUFF ERROR ===');
        
        let errorMessage = 'Unknown error occurred';
        let errorType = 'unknown';
        
        if (error.response) {
            // Server responded with error status
            console.error('📡 Response status:', error.response.status);
            console.error('📊 Response data:', error.response.data);
            
            errorType = 'server_error';
            errorMessage = error.response.data?.message || 
                          error.response.data?.error || 
                          `Server error: ${error.response.status} - ${error.response.statusText}`;
            
        } else if (error.request) {
            // Request was made but no response received
            console.error('❌ No response received');
            
            errorType = 'no_response';
            errorMessage = 'No response from server - server may be down or unreachable';
            
            // Check specific error codes
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout - server took too long to respond';
            } else if (error.code === 'NETWORK_ERROR') {
                errorMessage = 'Network error - check your internet connection';
            } else if (error.code === 'ERR_NETWORK') {
                errorMessage = 'Network error - cannot connect to server';
            }
        } else {
            // Something else happened
            console.error('⚙️ Request setup error:', error.message);
            errorType = 'request_error';
            errorMessage = error.message;
        }
        
        console.error('🚨 Final error type:', errorType);
        console.error('🚨 Final error message:', errorMessage);
        
        dispatch(authError(errorMessage));
    }
};

// Test server connection function
export const testServerConnection = () => async () => {
    try {
        console.log('🔍 Testing server connection...');
        
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/`, {
            timeout: 5000
        });
        
        console.log('✅ Server is running:', response.status);
        return true;
    } catch (error) {
        console.error('❌ Server connection test failed:', error.message);
        
        let detailedMessage = 'Server is not accessible: ';
        if (error.code === 'ECONNREFUSED') {
            detailedMessage += 'Connection refused - server may not be running';
        } else if (error.code === 'ENOTFOUND') {
            detailedMessage += 'Server host not found - check REACT_APP_BASE_URL';
        } else if (error.code === 'ECONNABORTED') {
            detailedMessage += 'Connection timeout - server took too long to respond';
        } else {
            detailedMessage += error.message;
        }
        
        console.error('💡 Troubleshooting:', detailedMessage);
        return false;
    }
};