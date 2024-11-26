import React from 'react';
import { Tree, TreeNode } from 'react-organizational-chart';


const data = {
    redBlackTreeCFS: {
        root: {
            id: 3,
            name: "Process 3",
            arrivalTime: 4,
            burstTime: 1,
            priority: 3,
            vruntime: 10,
            color: "black",
            left: {
                id: 1,
                name: "Process 1",
                arrivalTime: 0,
                burstTime: 5,
                priority: 2,
                vruntime: 20,
                color: "red",
                left: null,
                right: null
            },
            right: {
                id: 4,
                name: "Process 4",
                arrivalTime: 6,
                burstTime: 7,
                priority: 2,
                vruntime: 15,
                color: "red",
                left: {
                    id: 2,
                    name: "Process 2",
                    arrivalTime: 2,
                    burstTime: 3,
                    priority: 1,
                    vruntime: 25,
                    color: "black",
                    left: null,
                    right: null
                },
                right: {
                    id: 5,
                    name: "Process 5",
                    arrivalTime: 8,
                    burstTime: 2,
                    priority: 1,
                    vruntime: 30,
                    color: "black",
                    left: null,
                    right: null
                }
            }
        }
    }
};

const renderTree = (node) => {
    if (!node) return null;

    return (
        <TreeNode
            label={
                <div
                    style={{
                        color: 'white',
                        padding: '10px',
                        border: '2px solid #ccc',
                        borderRadius: '50%',
                        backgroundColor: node.color,
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Added shadow for depth
                        transition: 'transform 0.2s', // Smooth transition for hover effect
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} // Scale on hover
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} // Reset scale
                >
                    {node.id}
                </div>
            }
        >
            <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                {node.left && renderTree(node.left)}
                {node.right && renderTree(node.right)}
            </div>
        </TreeNode>
    );
};

function Plot6() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}> {/* Added padding around the tree */}
            <Tree
                lineWidth={'3px'} // Thicker lines for better visibility
                lineColor={'#4CAF50'} // Changed line color to a pleasant green
                lineBorderRadius={'10px'}
                label={
                    <div
                        style={{
                            color: 'white',
                            padding: '10px',
                            border: '2px solid #ccc',
                            borderRadius: '50%',
                            backgroundColor: data.redBlackTreeCFS.root.color,
                            width: '60px',
                            height: '60px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Added shadow for depth
                        }}
                    >
                        {data.redBlackTreeCFS.root.id}
                    </div>
                }
            >
                {renderTree(data.redBlackTreeCFS.root.left)}
                {renderTree(data.redBlackTreeCFS.root.right)}
            </Tree>
        </div>
    );
}


export default Plot6;