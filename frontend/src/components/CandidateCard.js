import React from 'react';
import { Card } from 'react-bootstrap';
import { Draggable } from 'react-beautiful-dnd';

const CandidateCard = ({ candidate, index, onClick }) => (
    <Draggable key={candidate.id} draggableId={candidate.id} index={index}>
        {(provided) => (
            <Card
                className="mb-2"
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                onClick={() => onClick(candidate)}
                data-testid={`candidate-card-${candidate.id}`}
            >
                <Card.Body>
                    <Card.Title as="h4">{candidate.name}</Card.Title>
                    <div role="img" aria-label="rating">
                        {'🟢'.repeat(candidate.rating || 0)}
                    </div>
                </Card.Body>
            </Card>
        )}
    </Draggable>
);

export default CandidateCard;
