import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import TaskItem from './TaskItem';
import { motion, AnimatePresence } from 'framer-motion';

export default function TaskList({ tasks, onToggle, onDelete, onDragEnd }) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
                <span className="text-6xl mb-4 block">🏝️</span>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Todo en orden</h3>
                <p className="text-slate-500 dark:text-slate-400">No tienes tareas pendientes. ¡Disfruta tu día!</p>
            </div>
        );
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="task-list">
                {(provided) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                    >
                        <AnimatePresence>
                            {tasks.map((task, index) => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    index={index}
                                    onToggle={onToggle}
                                    onDelete={onDelete}
                                />
                            ))}
                        </AnimatePresence>
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}
