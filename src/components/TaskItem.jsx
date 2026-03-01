import { Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { Check, Trash2, GripVertical } from 'lucide-react';

export default function TaskItem({ task, index, onToggle, onDelete }) {
    return (
        <Draggable draggableId={String(task.id)} index={index}>
            {(provided, snapshot) => (
                <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`group flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${snapshot.isDragging
                            ? 'shadow-xl border-blue-400 bg-white dark:bg-slate-800 scale-[1.02] z-50'
                            : `${task.completed ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 shadow-sm'}`
                        }`}
                >
                    <div {...provided.dragHandleProps} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5" />
                    </div>

                    <button
                        onClick={() => onToggle(task.id, task.completed)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border-2 transition-all duration-200 ${task.completed
                                ? 'bg-blue-500 border-blue-500 text-white'
                                : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
                            }`}
                    >
                        <motion.div initial={false} animate={{ scale: task.completed ? 1 : 0 }}>
                            <Check className="w-4 h-4" />
                        </motion.div>
                    </button>

                    <span className={`flex-1 min-w-0 transition-colors duration-200 ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'
                        }`}>
                        {task.title}
                    </span>

                    <button
                        onClick={() => onDelete(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2 rounded-lg transition-all duration-200"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
        </Draggable>
    );
}
